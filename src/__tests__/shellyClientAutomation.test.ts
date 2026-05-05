/**
 * Tests for new automation service methods in ShellyClient
 * (Webhook, KVS, Script)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShellyClient } from '../services/shellyClient';
import type { StoredDevice } from '../types/device';

vi.mock('@tauri-apps/plugin-http', () => ({
  fetch: vi.fn(),
}));

import { fetch } from '@tauri-apps/plugin-http';

const mockDevice: StoredDevice = {
  id: 'test-device',
  ip: '192.168.1.100',
  port: 80,
  name: 'Test Device',
  model: 'SNSW-001P16EU',
  app: 'Switch',
  generation: 'gen2',
  type: 'switch',
  components: [],
  addedAt: Date.now(),
  lastSeenAt: Date.now(),
};

function mockResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve(body),
  } as Response);
}

describe('ShellyClient automation methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Webhook ───────────────────────────────────────────────────────────────

  it('webhookList calls Webhook.List', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: { hooks: [] } }));
    const client = new ShellyClient(mockDevice);
    await client.webhookList();
    expect(fetch).toHaveBeenCalledWith(
      'http://192.168.1.100:80/rpc',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Webhook.List'),
      }),
    );
  });

  it('webhookCreate calls Webhook.Create with config', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: { id: 5 } }));
    const client = new ShellyClient(mockDevice);
    const result = await client.webhookCreate({
      event: 'switch.toggle',
      enable: true,
      urls: ['http://example.com'],
    });
    expect(result.id).toBe(5);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Webhook.Create');
    expect(body.params.event).toBe('switch.toggle');
  });

  it('webhookUpdate calls Webhook.Update with id and config', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    await client.webhookUpdate(3, { enable: false });
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Webhook.Update');
    expect(body.params.id).toBe(3);
    expect(body.params.config.enable).toBe(false);
  });

  it('webhookDelete calls Webhook.Delete', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    await client.webhookDelete(2);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Webhook.Delete');
    expect(body.params.id).toBe(2);
  });

  it('webhookDeleteAll calls Webhook.DeleteAll', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    await client.webhookDeleteAll();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Webhook.DeleteAll');
  });

  // ── KVS ───────────────────────────────────────────────────────────────────

  it('kvsList calls KVS.List', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: { items: [] } }));
    const client = new ShellyClient(mockDevice);
    await client.kvsList();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('KVS.List');
  });

  it('kvsGet calls KVS.Get with key', async () => {
    vi.mocked(fetch).mockReturnValue(
      mockResponse({ id: 1, src: 'device', result: { key: 'foo', value: 'bar', etag: 'abc' } }),
    );
    const client = new ShellyClient(mockDevice);
    const result = await client.kvsGet('foo');
    expect(result.value).toBe('bar');
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('KVS.Get');
    expect(body.params.key).toBe('foo');
  });

  it('kvsSet calls KVS.Set with key, value and optional etag', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    await client.kvsSet('foo', { data: 123 }, 'etag123');
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('KVS.Set');
    expect(body.params.key).toBe('foo');
    expect(body.params.value).toEqual({ data: 123 });
    expect(body.params.etag).toBe('etag123');
  });

  it('kvsDelete calls KVS.Delete', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    await client.kvsDelete('foo');
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('KVS.Delete');
    expect(body.params.key).toBe('foo');
  });

  // ── Script ────────────────────────────────────────────────────────────────

  it('scriptList calls Script.List', async () => {
    vi.mocked(fetch).mockReturnValue(
      mockResponse({ id: 1, src: 'device', result: { scripts: [] } }),
    );
    const client = new ShellyClient(mockDevice);
    await client.scriptList();
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Script.List');
  });

  it('scriptCreate calls Script.Create with name', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: { id: 7 } }));
    const client = new ShellyClient(mockDevice);
    const result = await client.scriptCreate('My Script');
    expect(result.id).toBe(7);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Script.Create');
    expect(body.params.name).toBe('My Script');
  });

  it('scriptPutCode chunks large code into multiple calls', async () => {
    vi.mocked(fetch).mockReturnValue(mockResponse({ id: 1, src: 'device', result: {} }));
    const client = new ShellyClient(mockDevice);
    const longCode = 'a'.repeat(9000); // Default chunk size is 4096
    await client.scriptPutCode(1, longCode);
    expect(fetch).toHaveBeenCalledTimes(3); // 4096 + 4096 + 808 = 9000

    const firstBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(firstBody.method).toBe('Script.PutCode');
    expect(firstBody.params.append).toBe(false);

    const secondBody = JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string);
    expect(secondBody.params.append).toBe(true);

    const thirdBody = JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as string);
    expect(thirdBody.params.append).toBe(true);
  });

  it('scriptEval calls Script.Eval and returns result', async () => {
    vi.mocked(fetch).mockReturnValue(
      mockResponse({ id: 1, src: 'device', result: { result: 42 } }),
    );
    const client = new ShellyClient(mockDevice);
    const result = await client.scriptEval(1, '1 + 1');
    expect(result.result).toBe(42);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body.method).toBe('Script.Eval');
    expect(body.params.code).toBe('1 + 1');
  });
});
