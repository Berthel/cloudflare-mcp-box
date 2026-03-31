/**
 * Lightweight Box REST API client for Cloudflare Workers.
 * Wraps fetch() with auth headers and automatic token refresh on 401.
 */

import { BOX_API_BASE, BOX_UPLOAD_BASE } from "./types.js";

export type BoxClientOptions = {
  accessToken: string;
  onTokenRefresh: () => Promise<string>;
};

export class BoxClient {
  private accessToken: string;
  private onTokenRefresh: () => Promise<string>;

  constructor(options: BoxClientOptions) {
    this.accessToken = options.accessToken;
    this.onTokenRefresh = options.onTokenRefresh;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
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

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: buildFormData(),
    });

    if (response.status === 401) {
      this.accessToken = await this.onTokenRefresh();
      const retryResponse = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: buildFormData(),
      });
      if (!retryResponse.ok) {
        throw new Error(`Box upload failed after token refresh: ${retryResponse.status} ${await retryResponse.text()}`);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`Box upload failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    let url = `${BOX_API_BASE}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      this.accessToken = await this.onTokenRefresh();
      headers.Authorization = `Bearer ${this.accessToken}`;
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Box API error ${response.status} ${method} ${path}: ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
