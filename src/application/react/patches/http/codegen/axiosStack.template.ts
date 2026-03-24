import type { ValidationCodegenKind } from "./validationProfile.js";

export function axiosInstanceSource(): string {
  return `import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { envConfig } from "../config";

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error: unknown) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => Promise.reject(error),
  );

  return instance;
};

export const baseAxiosInstance = createAxiosInstance(envConfig.apiBaseUrl);
`;
}

export function axiosBaseServiceSource(kind: ValidationCodegenKind): string {
  if (kind === "none") {
    return `import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AxiosHeaders } from "axios";
import { baseAxiosInstance } from "./axios";
import { resolveContentType } from "./resolveContentType";
import { ApiError } from "./errors";
import { toApiError } from "./errorAdapter";

const axiosConfigForMutation = (
  body: unknown,
  config?: AxiosRequestConfig,
): AxiosRequestConfig => {
  const extra = { ...config };
  delete extra.headers;
  const headers = new AxiosHeaders();
  if (body !== undefined) {
    headers.set("Content-Type", resolveContentType(body));
  }
  if (config?.headers !== undefined) {
    const incoming = new AxiosHeaders(config.headers);
    incoming.forEach((value: string, key: string) => {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    });
  }
  return { ...extra, headers };
};

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;

export interface RequestOptions {
  config?: RequestConfig<unknown>;
}

export interface BaseServiceOptions {
  basePath: string;
  client?: AxiosInstance;
}

export abstract class BaseService {
  protected readonly client: AxiosInstance;
  protected readonly basePath: string;

  protected constructor({ client = baseAxiosInstance, basePath }: BaseServiceOptions) {
    this.client = client;
    this.basePath = basePath;
  }

  protected buildUrl(path: string = ""): string {
    if (!path) return this.basePath;
    if (path.startsWith("/")) return \`\${this.basePath}\${path}\`;
    return \`\${this.basePath}/\${path}\`;
  }

  protected async request(
    method: HttpMethod,
    path: string,
    options?: { body?: unknown; config?: RequestConfig<unknown> },
  ): Promise<unknown> {
    const url = this.buildUrl(path);
    const config = options?.config;
    const body = options?.body;

    try {
      let response: AxiosResponse<unknown>;
      switch (method) {
        case "get":
          response = await this.client.get(url, config);
          break;
        case "delete":
          response = await this.client.delete(url, config);
          break;
        case "post":
          response = await this.client.post(url, body, axiosConfigForMutation(body, config));
          break;
        case "put":
          response = await this.client.put(url, body, axiosConfigForMutation(body, config));
          break;
        case "patch":
          response = await this.client.patch(url, body, axiosConfigForMutation(body, config));
          break;
        default:
          throw new ApiError({ message: \`Unsupported HTTP method: \${method}\`, kind: "unknown" });
      }
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  protected async get(path: string, options?: RequestOptions): Promise<unknown> {
    return this.request("get", path, { config: options?.config });
  }

  protected async post(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("post", path, { body, config: options?.config });
  }

  protected async put(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("put", path, { body, config: options?.config });
  }

  protected async patch(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("patch", path, { body, config: options?.config });
  }

  protected async delete(path: string, options?: RequestOptions): Promise<unknown> {
    return this.request("delete", path, { config: options?.config });
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

  return `import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AxiosHeaders } from "axios";
import type { ZodType } from "zod";
import { baseAxiosInstance } from "./axios";
import { resolveContentType } from "./resolveContentType";
import { ApiError } from "./errors";
import { validateResponse } from "./validation";
import { toApiError } from "./errorAdapter";

const axiosConfigForMutation = (
  body: unknown,
  config?: AxiosRequestConfig,
): AxiosRequestConfig => {
  const extra = { ...config };
  delete extra.headers;
  const headers = new AxiosHeaders();
  if (body !== undefined) {
    headers.set("Content-Type", resolveContentType(body));
  }
  if (config?.headers !== undefined) {
    const incoming = new AxiosHeaders(config.headers);
    incoming.forEach((value: string, key: string) => {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    });
  }
  return { ...extra, headers };
};

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;

export interface RequestOptions<TResponse> {
  config?: RequestConfig<unknown>;
  schema?: ZodType<TResponse>;
}

export interface BaseServiceOptions {
  basePath: string;
  client?: AxiosInstance;
}

export abstract class BaseService {
  protected readonly client: AxiosInstance;
  protected readonly basePath: string;

  protected constructor({ client = baseAxiosInstance, basePath }: BaseServiceOptions) {
    this.client = client;
    this.basePath = basePath;
  }

  protected buildUrl(path: string = ""): string {
    if (!path) return this.basePath;
    if (path.startsWith("/")) return \`\${this.basePath}\${path}\`;
    return \`\${this.basePath}/\${path}\`;
  }

  protected async request<TResponse>(
    method: HttpMethod,
    path: string,
    options?: { body?: unknown; config?: RequestConfig<unknown>; schema?: ZodType<TResponse> },
  ): Promise<TResponse | unknown> {
    const url = this.buildUrl(path);
    const config = options?.config;
    const body = options?.body;
    const schema = options?.schema;

    try {
      let response: AxiosResponse<unknown>;
      switch (method) {
        case "get":
          response = await this.client.get(url, config);
          break;
        case "delete":
          response = await this.client.delete(url, config);
          break;
        case "post":
          response = await this.client.post(url, body, axiosConfigForMutation(body, config));
          break;
        case "put":
          response = await this.client.put(url, body, axiosConfigForMutation(body, config));
          break;
        case "patch":
          response = await this.client.patch(url, body, axiosConfigForMutation(body, config));
          break;
        default:
          throw new ApiError({ message: \`Unsupported HTTP method: \${method}\`, kind: "unknown" });
      }
      const data = response.data;
      if (schema) {
        return validateResponse(schema, data);
      }
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  }

  protected async get<TResponse>(path: string, options?: RequestOptions<TResponse>): Promise<TResponse | unknown> {
    return this.request<TResponse>("get", path, {
      config: options?.config,
      schema: options?.schema,
    });
  }

  protected async post<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("post", path, {
      body,
      config: options?.config,
      schema: options?.schema,
    });
  }

  protected async put<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("put", path, {
      body,
      config: options?.config,
      schema: options?.schema,
    });
  }

  protected async patch<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("patch", path, {
      body,
      config: options?.config,
      schema: options?.schema,
    });
  }

  protected async delete<TResponse>(path: string, options?: RequestOptions<TResponse>): Promise<TResponse | unknown> {
    return this.request<TResponse>("delete", path, {
      config: options?.config,
      schema: options?.schema,
    });
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
