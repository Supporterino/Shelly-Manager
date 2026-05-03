export interface DiscoveredHost {
  ip: string;
  port: number;
  hostname?: string;
  source: 'mdns' | 'scan' | 'manual';
}

export type DiscoveryMethod = 'mdns' | 'scan' | 'manual';

export interface NetworkInterface {
  name: string;
  ip: string;
  prefix: number | null;
}

export interface DiscoveryOptions {
  cidr?: string;
  timeoutSecs?: number;
  port?: number;
}
