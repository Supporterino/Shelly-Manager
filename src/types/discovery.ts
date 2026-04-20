export interface DiscoveredHost {
  ip: string;
  port: number;
  hostname?: string;
  source: 'mdns' | 'scan' | 'manual';
}

export type DiscoveryMethod = 'mdns' | 'scan' | 'manual';

export interface DiscoveryOptions {
  cidr?: string;
  timeoutSecs?: number;
  port?: number;
}
