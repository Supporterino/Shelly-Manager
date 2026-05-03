import { useCallback, useState } from 'react';
import { cancelScan, runDiscovery } from '../services/discovery';
import type { StoredDevice } from '../types/device';
import type { DiscoveredHost, DiscoveryMethod, DiscoveryOptions, ScanProgress } from '../types/discovery';

export type DiscoveryStatus = 'idle' | 'running' | 'done' | 'error';

export function useDiscovery() {
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [found, setFound] = useState<StoredDevice[]>([]);
  const [progress, setProgress] = useState<DiscoveredHost[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (methods: DiscoveryMethod[], opts: DiscoveryOptions) => {
    setStatus('running');
    setFound([]);
    setProgress([]);
    setScanProgress(null);
    setError(null);

    try {
      const devices = await runDiscovery(
        methods,
        {
          ...opts,
          onScanProgress: (p: ScanProgress) => setScanProgress(p),
        },
        (host: DiscoveredHost) => {
          setProgress((prev) => [...prev, host]);
        },
      );
      setFound(devices);
      setStatus('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
    }
  }, []);

  const cancel = useCallback(async () => {
    await cancelScan();
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setFound([]);
    setProgress([]);
    setScanProgress(null);
    setError(null);
  }, []);

  return { status, found, progress, scanProgress, error, start, cancel, reset };
}
