/**
 * Lightweight Box REST API client for Cloudflare Workers.
 * Wraps fetch() with auth headers and automatic token refresh on 401.
 */

import { BOX_API_BASE, BOX_UPLOAD_BASE } from "./types.js";

// ── Structured error class ──────────────────────────────────────────

type BoxErrorBody = {
  type?: string;
  status?: number;
  code?: string;
  message?: string;
  context_info?: { errors?: Array<{ reason?: string; name?: string; message?: string }> };
  request_id?: string;
};

export class BoxApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly contextErrors: Array<{ reason?: string; name?: string; message?: string }>;

  constructor(
    status: number,
    method: string,
    path: string,
    body: BoxErrorBody | string,
  ) {
    const parsed = typeof body === "string" ? BoxApiError.tryParse(body) : body;
    const boxMsg = parsed?.message ?? (typeof body === "string" ? body : "Unknown error");
    const code = parsed?.code ?? `http_${status}`;
    const requestId = parsed?.request_id;
    const contextErrors = parsed?.context_info?.errors ?? [];

    let detail = contextErrors
      .map((e) => e.message ?? e.reason)
      .filter(Boolean)
      .join("; ");
    if (detail) detail = ` Details: ${detail}.`;

    const fullMsg = `Box API ${method} ${path} failed (${status} ${code}): ${boxMsg}.${detail}`;
    super(fullMsg);
    this.name = "BoxApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.contextErrors = contextErrors;
  }

  private static tryParse(text: string): BoxErrorBody | null {
    try {
      return JSON.parse(text) as BoxErrorBody;
    } catch {
      return null;
    }
  }
}

// ── Client options ──────────────────────────────────────────────────

export type BoxClientOptions = {
  accessToken: string;
  onTokenRefresh: () => Promise<string>;
};

export class BoxClient {
  private accessToken: string;
  private onTokenRefresh: () => Promise<string>;
  private refreshPromise: Promise<string> | null = null;

  constructor(options: BoxClientOptions) {
    this.accessToken = options.accessToken;
    this.onTokenRefresh = options.onTokenRefresh;
  }

  /**
   * Coalesces concurrent token refreshes into a single request.
   * Subsequent callers await the same in-flight Promise instead of
   * triggering independent refresh calls to Box.
   */
  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.onTokenRefresh()
      .then((newToken) => {
        this.accessToken = newToken;
        return newToken;
      })
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T = unknown>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>("POST", path, body, params);
  }

  async put<T = unknown>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>("PUT", path, body, params);
  }

  async delete<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("DELETE", path, undefined, params);
  }

  async patch<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  /**
   * PATCH with application/json-patch+json Content-Type.
   * Required by Box metadata instance update API.
   */
  async jsonPatch<T = unknown>(path: string, operations: unknown): Promise<T> {
    return this.request<T>("PATCH", path, operations, undefined, {
      "Content-Type": "application/json-patch+json",
    });
  }

  /**
   * Fetch raw Response (for file downloads, thumbnails, etc.).
   * Does NOT parse JSON — caller handles the response body.
   */
  async getRaw(path: string, params?: Record<string, string>, extraHeaders?: Record<string, string>): Promise<Response> {
    return this.requestRaw("GET", path, undefined, params, extraHeaders);
  }

  /**
   * GET /shared_items with the BoxAPI header for shared link resolution.
   */
  async getSharedItem<T = unknown>(sharedLinkUrl: string, password?: string): Promise<T> {
    let boxApiHeader = `shared_link=${sharedLinkUrl}`;
    if (password) boxApiHeader += `&shared_link_password=${password}`;
    return this.request<T>("GET", "/shared_items", undefined, undefined, { BoxAPI: boxApiHeader });
  }

  /**
   * Upload a file to Box via the upload endpoint.
   * Uses multipart/form-data as required by Box upload API.
   */
  async upload(parentFolderId: string, fileName: string, content: string | ArrayBuffer): Promise<unknown> {
    const url = `${BOX_UPLOAD_BASE}/files/content`;
    const attributes = JSON.stringify({
      name: fileName,
      parent: { id: parentFolderId },
    });

    const buildFormData = () => {
      const fd = new FormData();
      fd.append("attributes", attributes);
      const blob = typeof content === "string"
        ? new Blob([content], { type: "text/plain" })
        : new Blob([content]);
      fd.append("file", blob, fileName);
      return fd;
    };

    let response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: buildFormData(),
    });

    if (response.status === 401) {
      await this.refreshToken();
      response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: buildFormData(),
      });
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") ?? "60";
      throw new BoxApiError(429, "POST", "/files/content", {
        code: "rate_limit",
        message: `Rate limited by Box. Retry after ${retryAfter} seconds`,
        status: 429,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new BoxApiError(response.status, "POST", "/files/content", errorText);
    }
    return response.json();
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    let url = `${BOX_API_BASE}${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return url;
  }

  private async requestRaw(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    extraHeaders?: Record<string, string>,
  ): Promise<Response> {
    const url = this.buildUrl(path, params);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      ...extraHeaders,
    };
    if (body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.refreshToken();
      headers.Authorization = `Bearer ${this.accessToken}`;
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") ?? "60";
      throw new BoxApiError(429, method, path, {
        code: "rate_limit",
        message: `Rate limited by Box. Retry after ${retryAfter} seconds`,
        status: 429,
      });
    }

    return response;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const response = await this.requestRaw(method, path, body, params, extraHeaders);

    if (!response.ok) {
      const errorText = await response.text();
      throw new BoxApiError(response.status, method, path, errorText);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
