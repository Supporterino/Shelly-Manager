use std::net::SocketAddr;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use mdns_sd::{ServiceDaemon, ServiceEvent};
use serde::{Deserialize, Serialize};
use tokio::task::JoinSet;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscoveredHost {
    pub ip: String,
    pub port: u16,
    pub hostname: Option<String>,
    pub source: String,
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
/// Uses concurrent TCP connect with a bounded semaphore.
#[tauri::command]
async fn scan_subnet(
    cidr: String,
    port: u16,
    timeout_ms: u64,
) -> Result<Vec<DiscoveredHost>, String> {
    let ips = expand_cidr(&cidr).map_err(|e| e.to_string())?;

    let timeout = Duration::from_millis(timeout_ms.max(100));
    let mut join_set: JoinSet<Option<DiscoveredHost>> = JoinSet::new();
    let semaphore = Arc::new(tokio::sync::Semaphore::new(50));

    for ip in ips {
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

    let mut results = Vec::new();
    while let Some(result) = join_set.join_next().await {
        if let Ok(Some(host)) = result {
            results.push(host);
        }
    }

    Ok(results)
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
        ips.push(format!("{}.{}.{}.{}", bytes[0], bytes[1], bytes[2], bytes[3]));
    }

    Ok(ips)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![discover_mdns, scan_subnet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
