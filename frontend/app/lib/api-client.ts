import { CONFIG } from './api-config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: BodyInit | null;
}

class ApiClient {
  private readonly baseURL: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseURL = CONFIG.baseURL.replace(/\/$/, '');
    this.timeoutMs = CONFIG.timeout;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (controller && this.timeoutMs > 0) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }

    try {
      const isAbsolute = /^https?:/i.test(endpoint);
      const normalizedEndpoint = isAbsolute
        ? endpoint
        : `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      const response = await fetch(normalizedEndpoint, {
        method: options.method ?? 'GET',
        headers: options.headers,
        body: options.body,
        signal: controller?.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`API request failed ${response.status}: ${text}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.append(key, String(value));
      });
    }

    return this.request<T>(url.toString());
  }

  async post<T>(endpoint: string, data?: any, options: { headers?: HeadersInit } = {}): Promise<T> {
    const headers: HeadersInit = { ...options.headers };
    let body: BodyInit | null = null;

    if (data instanceof FormData) {
      body = data;
    } else if (data instanceof Blob || typeof data === 'string') {
      body = data as BodyInit;
    } else if (data !== undefined) {
      body = JSON.stringify(data);
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    return this.request<T>(endpoint, { method: 'POST', headers, body });
  }

  async put<T>(endpoint: string, data?: any, options: { headers?: HeadersInit } = {}): Promise<T> {
    const headers: HeadersInit = { ...options.headers };
    let body: BodyInit | null = null;

    if (data instanceof FormData) {
      body = data;
    } else if (data !== undefined) {
      body = JSON.stringify(data);
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    return this.request<T>(endpoint, { method: 'PUT', headers, body });
  }

  async patch<T>(endpoint: string, data?: any, options: { headers?: HeadersInit } = {}): Promise<T> {
    const headers: HeadersInit = { ...options.headers };
    let body: BodyInit | null = null;

    if (data instanceof FormData) {
      body = data;
    } else if (data !== undefined) {
      body = JSON.stringify(data);
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    return this.request<T>(endpoint, { method: 'PATCH', headers, body });
  }

  async delete<T>(endpoint: string, options: { headers?: HeadersInit } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers: options.headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
