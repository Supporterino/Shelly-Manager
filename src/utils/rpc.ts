let _rpcId = 1;

export interface RpcFrame {
  id: number;
  src: string;
  method: string;
  params?: Record<string, unknown>;
  auth?: RpcAuth;
}

export interface RpcAuth {
  realm: string;
  username: string;
  nonce: number;
  cnonce: number;
  response: string;
  algorithm: 'SHA-256';
}

export interface RpcResponse<T = unknown> {
  id: number;
  src: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export function buildRpcFrame(
  method: string,
  params?: Record<string, unknown>,
  auth?: RpcAuth,
): RpcFrame {
  return {
    id: _rpcId++,
    src: 'shellman',
    method,
    ...(params ? { params } : {}),
    ...(auth ? { auth } : {}),
  };
}

export function parseRpcResponse<T>(body: unknown): T {
  const response = body as RpcResponse<T>;
  if (response.error) {
    const err = new Error(response.error.message);
    (err as Error & { code: number }).code = response.error.code;
    throw err;
  }
  return response.result as T;
}
