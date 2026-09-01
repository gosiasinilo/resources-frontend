import { API_BASE_URL } from "../../config/config";

const USER = import.meta.env.VITE_ADMIN_USER;
const PASS = import.meta.env.VITE_ADMIN_PASS;
const BASIC_AUTH = USER && PASS ? "Basic " + btoa(`${USER}:${PASS}`) : "";

export class HttpError extends Error {
  status: number;
data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

type FetchOptions = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, string>;
};

class ApiClient {
  private API_URL: string;

  constructor() {
    this.API_URL = API_BASE_URL;
  }

  private async doFetch<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
    opts: FetchOptions = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(BASIC_AUTH ? { Authorization: BASIC_AUTH } : {}),
      ...opts.headers,
    };

    const fetchBody: BodyInit | undefined = body !== undefined ? JSON.stringify(body) : undefined;

    const res = await fetch(this.API_URL + endpoint, {
      method,
      headers,
      body: fetchBody,
      credentials: "include",
      ...opts,
    });

    const contentType = res.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    if (!res.ok) {
      const errBody = isJson ? await res.json().catch(() => ({})) : await res.text();
      throw new HttpError(
        res.status,
        typeof errBody === "string" ? errBody : errBody.message || "Fetch error", errBody
      );
    }

    return isJson && res.status !== 204 ? (res.json() as Promise<T>) : (undefined as unknown as T);
  }

  public get<T>(endpoint: string, options?: FetchOptions) {
    return this.doFetch<T>(endpoint, "GET", undefined, options);
  }

  public post<T>(endpoint: string, body: unknown, options?: FetchOptions) {
    return this.doFetch<T>(endpoint, "POST", body, options);
  }

  public patch<T>(endpoint: string, body?: unknown, options?: FetchOptions) {
    return this.doFetch<T>(endpoint, "PATCH", body, options);
  }
  public delete<T>(endpoint: string, options?: FetchOptions) {
  return this.doFetch<T>(endpoint, 'DELETE', undefined, options);
}
}

export const apiClient = new ApiClient();