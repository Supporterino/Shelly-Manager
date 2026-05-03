use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use mdns_sd::{ServiceDaemon, ServiceEvent};
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use tokio::task::JoinSet;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscoveredHost {
    pub ip: String,
    pub port: u16,
    pub hostname: Option<String>,
    pub source: String,
}

/// State shared between commands (e.g. cancellation flags).
pub struct AppState {
    cancel_scan: AtomicBool,
}

/// Progress payload sent from Rust to the frontend during subnet scanning.
#[derive(Clone, Serialize)]
struct ScanProgress {
    scanned: u32,
    total: u32,
    found: u32,
    current_host: Option<DiscoveredHost>,
}

/// Discover Shelly devices via mDNS.
/// Browses _shelly._tcp.local. (Gen2+ exclusive) and _http._tcp.local.
/// with gen=2/3/4 TXT filter.
#[tauri::command]
async fn discover_mdns(timeout_secs: u64) -> Result<Vec<DiscoveredHost>, String> {
    let found: Arc<Mutex<Vec<DiscoveredHost>>> = Arc::new(Mutex::new(Vec::new()));
    let found_clone = found.clone();

    let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;

    // Browse _shelly._tcp.local.
    let shelly_receiver = mdns
        .browse("_shelly._tcp.local.")
        .map_err(|e| e.to_string())?;

    // Browse _http._tcp.local. as fallback (filter by gen= TXT)
    let http_receiver = mdns
        .browse("_http._tcp.local.")
        .map_err(|e| e.to_string())?;

    let timeout = Duration::from_secs(timeout_secs.max(2));
    let start = std::time::Instant::now();

    loop {
        if start.elapsed() >= timeout {
            break;
        }

        // Poll shelly receiver
        while let Ok(event) = shelly_receiver.try_recv() {
            if let ServiceEvent::ServiceResolved(info) = event {
                for addr in info.get_addresses() {
                    let ip = addr.to_string();
                    let port = info.get_port();
                    let hostname = Some(info.get_hostname().to_string());
                    let mut locked = found_clone.lock().unwrap();
                    if !locked.iter().any(|h: &DiscoveredHost| h.ip == ip) {
                        locked.push(DiscoveredHost {
                            ip,
                            port,
                            hostname,
                            source: "mdns".to_string(),
                        });
                    }
                }
            }
        }

        // Poll http receiver — filter by gen TXT property
        while let Ok(event) = http_receiver.try_recv() {
            if let ServiceEvent::ServiceResolved(info) = event {
                let props = info.get_properties();
                let is_shelly_gen2 = props.iter().any(|p| {
                    p.key() == "gen"
                        && matches!(p.val_str(), "2" | "3" | "4")
                });
                if is_shelly_gen2 {
                    for addr in info.get_addresses() {
                        let ip = addr.to_string();
                        let port = info.get_port();
                        let hostname = Some(info.get_hostname().to_string());
                        let mut locked = found_clone.lock().unwrap();
                        if !locked.iter().any(|h: &DiscoveredHost| h.ip == ip) {
                            locked.push(DiscoveredHost {
                                ip,
                                port,
                                hostname,
                                source: "mdns".to_string(),
                            });
                        }
                    }
                }
            }
        }

        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    let _ = mdns.shutdown();
    let result = found.lock().unwrap().clone();
    Ok(result)
}

/// Scan a CIDR subnet for hosts listening on the given port.
///
/// IPs are processed in chunks of 256 to keep the number of in-flight Tokio
/// tasks and open file descriptors bounded, regardless of CIDR size. A hard
/// cap of 65 534 hosts (prefix ≥ /16) is enforced; callers should validate
/// the CIDR in the UI before invoking this command.
#[tauri::command]
async fn scan_subnet(
    cidr: String,
    port: u16,
    timeout_ms: u64,
    on_progress: Channel<ScanProgress>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<DiscoveredHost>, String> {
    let ips = expand_cidr(&cidr).map_err(|e| e.to_string())?;

    // Hard cap — refuse subnets larger than /16 to prevent multi-hour scans.
    if ips.len() > 65_534 {
        return Err(
            "CIDR too large — maximum supported range is /16 (65 534 hosts). \
             Use a narrower subnet."
                .to_string(),
        );
    }

    // Reset cancellation flag at the start of every scan.
    state.cancel_scan.store(false, Ordering::Relaxed);

    let timeout = Duration::from_millis(timeout_ms.max(100));
    let semaphore = Arc::new(tokio::sync::Semaphore::new(100));
    let mut results: Vec<DiscoveredHost> = Vec::new();

    let total = ips.len() as u32;
    let mut scanned: u32 = 0;

    // Process in chunks of 256 IPs to bound memory and file-descriptor usage.
    for chunk in ips.chunks(256) {
        let mut join_set: JoinSet<Option<DiscoveredHost>> = JoinSet::new();

        for ip in chunk {
            let sem = semaphore.clone();
            let ip_str = ip.clone();
            join_set.spawn(async move {
                let _permit = sem.acquire().await.ok()?;
                let addr: SocketAddr = format!("{}:{}", ip_str, port)
                    .parse()
                    .ok()?;
                match tokio::time::timeout(timeout, tokio::net::TcpStream::connect(addr)).await {
                    Ok(Ok(_)) => Some(DiscoveredHost {
                        ip: ip_str,
                        port,
                        hostname: None,
                        source: "scan".to_string(),
                    }),
                    _ => None,
                }
            });
        }

        while let Some(result) = join_set.join_next().await {
            if let Ok(Some(host)) = result {
                results.push(host);
            }
        }

        scanned += chunk.len() as u32;

        let _ = on_progress.send(ScanProgress {
            scanned,
            total,
            found: results.len() as u32,
            current_host: None,
        });

        if state.cancel_scan.load(Ordering::Relaxed) {
            break;
        }
    }

    Ok(results)
}

/// Signal an in-flight subnet scan to stop early.
/// The scan command will return whatever hosts it found up to that point.
#[tauri::command]
async fn cancel_scan(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.cancel_scan.store(true, Ordering::Relaxed);
    Ok(())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInterface {
    pub name: String,
    pub ip: String,
    pub prefix: Option<u8>,
}

/// Returns all non-loopback IPv4 network interfaces with their subnet prefix.
/// On mobile or restricted environments the prefix may be None, which the
/// frontend should treat as an unknown netmask.
#[tauri::command]
async fn get_network_interfaces() -> Result<Vec<NetworkInterface>, String> {
    let addrs = if_addrs::get_if_addrs().map_err(|e| e.to_string())?;

    let mut interfaces = Vec::new();
    for iface in addrs {
        if iface.is_loopback() {
            continue;
        }
        if let if_addrs::IfAddr::V4(ref v4) = iface.addr {
            // Skip interfaces that are not operationally up
            if !iface.is_oper_up() {
                continue;
            }
            let prefix = {
                let ones = v4.prefixlen;
                // /30, /31, /32 are too small for meaningful scanning;
                // treat them as unknown so the frontend falls back to /24.
                if ones >= 30 || ones < 8 {
                    None
                } else {
                    Some(ones)
                }
            };
            interfaces.push(NetworkInterface {
                name: iface.name.clone(),
                ip: v4.ip.to_string(),
                prefix,
            });
        }
    }

    Ok(interfaces)
}

/// Expand a CIDR notation into individual IP strings.
fn expand_cidr(cidr: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let parts: Vec<&str> = cidr.split('/').collect();
    if parts.len() != 2 {
        return Err("Invalid CIDR notation".into());
    }

    let ip_parts: Vec<u8> = parts[0]
        .split('.')
        .map(|p| p.parse::<u8>())
        .collect::<Result<Vec<_>, _>>()?;

    if ip_parts.len() != 4 {
        return Err("Invalid IP address".into());
    }

    let prefix_len: u32 = parts[1].parse()?;
    if prefix_len > 32 {
        return Err("Prefix length must be <= 32".into());
    }

    let base_ip = u32::from_be_bytes([ip_parts[0], ip_parts[1], ip_parts[2], ip_parts[3]]);
    let mask = if prefix_len == 0 {
        0u32
    } else {
        !0u32 << (32 - prefix_len)
    };
    let network = base_ip & mask;
    let broadcast = network | (!mask);

    let mut ips = Vec::new();
    // Skip network and broadcast addresses
    for ip_int in (network + 1)..broadcast {
        let bytes = ip_int.to_be_bytes();
        ips.push(format!("{}.{ }.{ }.{ }", bytes[0], bytes[1], bytes[2], bytes[3]));
    }

    Ok(ips)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            cancel_scan: AtomicBool::new(false),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            discover_mdns,
            scan_subnet,
            cancel_scan,
            get_network_interfaces
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
