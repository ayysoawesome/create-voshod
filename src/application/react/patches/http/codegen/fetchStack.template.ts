import type { ValidationCodegenKind } from "./validationProfile.js";

export function fetchHttpClientSource(): string {
  return `import { envConfig } from "../config";
import { resolveContentType } from "./resolveContentType";
import { ApiError } from "./errors";

export class HttpClient {
  private joinUrl(base: string, path: string): string {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : \`/\${path}\`;
    return \`\${b}\${p}\`;
  }

  private async readResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new ApiError({
        message: response.statusText || "Request failed",
        kind: "http",
        status: response.status,
      });
    }
    return response.json() as Promise<T>;
  }

  private applyInitHeaders(target: Headers, initHeaders?: HeadersInit): void {
    if (!initHeaders) {
      return;
    }
    const incoming = new Headers(initHeaders);
    incoming.forEach((value, key) => {
      target.set(key, value);
    });
  }

  private buildFetchInit(method: string, body: unknown, init?: RequestInit): RequestInit {
    const headers = new Headers();
    let requestBody: BodyInit | undefined;

    const m = method.toUpperCase();
    const needsBody = m === "POST" || m === "PUT" || m === "PATCH";

    if (needsBody && body !== undefined) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        requestBody = body;
      } else if (typeof Blob !== "undefined" && body instanceof Blob) {
        requestBody = body;
      } else if (body instanceof URLSearchParams) {
        requestBody = body;
      } else if (typeof body === "string") {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
      }
      headers.set("Content-Type", resolveContentType(body));
    }

    this.applyInitHeaders(headers, init?.headers);

    const rest: RequestInit = { ...(init ?? {}) };
    delete rest.headers;
    delete rest.body;
    delete rest.method;
    return {
      ...rest,
      method: m,
      headers,
      body: needsBody ? requestBody : undefined,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: BodyInit,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.joinUrl(envConfig.apiBaseUrl, path);
    const response = await fetch(url, this.buildFetchInit(method, body, init));
    return this.readResponse<T>(response);
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("GET", path, undefined, init);
  }

  post<T>(path: string, body?: BodyInit, init?: RequestInit): Promise<T> {
    return this.request<T>("POST", path, body, init);
  }

  put<T>(path: string, body?: BodyInit, init?: RequestInit): Promise<T> {
    return this.request<T>("PUT", path, body, init);
  }

  patch<T>(path: string, body?: BodyInit, init?: RequestInit): Promise<T> {
    return this.request<T>("PATCH", path, body, init);
  }

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("DELETE", path, undefined, init);
  }
}

export const httpClient = new HttpClient();
`;
}

export function fetchBaseServiceSource(kind: ValidationCodegenKind): string {
  if (kind === "none") {
    return `import { httpClient } from "./httpClient";
import { toApiError } from "./errorAdapter";

export interface BaseServiceOptions {
  basePath: string;
}

export abstract class BaseService {
  protected readonly basePath: string;

  protected constructor({ basePath }: BaseServiceOptions) {
    this.basePath = basePath;
  }

  protected buildUrl(path: string = ""): string {
    if (!path) return this.basePath;
    if (path.startsWith("/")) return \`\${this.basePath}\${path}\`;
    return \`\${this.basePath}/\${path}\`;
  }

  protected async request(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    body?: BodyInit,
  ): Promise<unknown> {
    const url = this.buildUrl(path);
    try {
      return await httpClient[method]<unknown>(url, body);
    } catch (error) {
      throw toApiError(error);
    }
  }

  public async get(path: string): Promise<unknown> {
    return this.request("get", path, undefined);
  }

  public async post(path: string, body?: BodyInit): Promise<unknown> {
    return this.request("post", path, body);
  }

  public async put(path: string, body?: BodyInit): Promise<unknown> {
    return this.request("put", path, body);
  }

  public async patch(path: string, body?: BodyInit): Promise<unknown> {
    return this.request("patch", path, body);
  }

  public async delete(path: string): Promise<unknown> {
    return this.request("delete", path, undefined);
  }
}

class RootBaseService extends BaseService {
  constructor() {
    super({ basePath: "" });
  }
}

export const baseService = new RootBaseService();
`;
  }

  return `import type { ZodType } from "zod";
import { httpClient } from "./httpClient";
import { validateResponse } from "./validation";
import { toApiError } from "./errorAdapter";

export interface BaseServiceOptions {
  basePath: string;
}

export abstract class BaseService {
  protected readonly basePath: string;

  protected constructor({ basePath }: BaseServiceOptions) {
    this.basePath = basePath;
  }

  protected buildUrl(path: string = ""): string {
    if (!path) return this.basePath;
    if (path.startsWith("/")) return \`\${this.basePath}\${path}\`;
    return \`\${this.basePath}/\${path}\`;
  }

  protected async request<T>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    body?: BodyInit,
    schema?: ZodType<T>,
  ): Promise<T | unknown> {
    const url = this.buildUrl(path);
    try {
      const data = await httpClient[method]<unknown>(url, body);
      return schema ? validateResponse(schema, data) : data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  public async get<TResponse>(
    path: string,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("get", path, undefined, schema);
  }

  public async post<TResponse>(
    path: string,
    body?: BodyInit,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("post", path, body, schema);
  }

  public async put<TResponse>(
    path: string,
    body?: BodyInit,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("put", path, body, schema);
  }

  public async patch<TResponse>(
    path: string,
    body?: BodyInit,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("patch", path, body, schema);
  }

  public async delete<TResponse>(
    path: string,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("delete", path, undefined, schema);
  }
}

class RootBaseService extends BaseService {
  constructor() {
    super({ basePath: "" });
  }
}

export const baseService = new RootBaseService();
`;
}
