import { useCallback, useState } from 'react';
import { runDiscovery } from '../services/discovery';
import type { StoredDevice } from '../types/device';
import type { DiscoveredHost, DiscoveryMethod, DiscoveryOptions } from '../types/discovery';

export type DiscoveryStatus = 'idle' | 'running' | 'done' | 'error';

export function useDiscovery() {
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [found, setFound] = useState<StoredDevice[]>([]);
  const [progress, setProgress] = useState<DiscoveredHost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (methods: DiscoveryMethod[], opts: DiscoveryOptions) => {
    setStatus('running');
    setFound([]);
    setProgress([]);
    setError(null);

    try {
      const devices = await runDiscovery(methods, opts, (host: DiscoveredHost) => {
        setProgress((prev) => [...prev, host]);
      });
      setFound(devices);
      setStatus('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setFound([]);
    setProgress([]);
    setError(null);
  }, []);

  return { status, found, progress, error, start, reset };
}
