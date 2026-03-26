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
    return `import type { AxiosInstance } from "axios";
import { baseAxiosInstance } from "./axios";
import { resolveContentType } from "./resolveContentType";
import { toApiError } from "./errorAdapter";
import { envConfig } from "../config";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RequestOptions {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
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
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    },
  ): Promise<unknown> {
    const url = this.buildUrl(path);
    const queryParams = options?.queryParams;
    const body = options?.body;
    const headers = {
      ...options?.headers,
      "Content-Type": resolveContentType(body),
    };

    try {
      const response = await this.client.request({
        url,
        method,
        params: queryParams,
        data: body,
        headers,
      });

      return response.data as unknown;
    } catch (error) {
      throw toApiError(error);
    }
  }

  public async get(path: string, options?: RequestOptions): Promise<unknown> {
    return this.request("get", path, {
      headers: options?.headers,
      queryParams: options?.queryParams,
    });
  }

  public async post(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("post", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
    });
  }

  public async put(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("put", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
    });
  }

  public async patch(path: string, body: unknown, options?: RequestOptions): Promise<unknown> {
    return this.request("patch", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
    });
  }

  public async delete(path: string, options?: RequestOptions): Promise<unknown> {
    return this.request("delete", path, {
      headers: options?.headers,
      queryParams: options?.queryParams,
    });
  }
}

class RootBaseService extends BaseService {
  constructor() {
    super({ basePath: envConfig.apiBaseUrl });
  }
}

export const baseService = new RootBaseService();
`;
  }

  return `import type { AxiosInstance } from "axios";
import type { ZodType } from "zod";
import { baseAxiosInstance } from "./axios";
import { resolveContentType } from "./resolveContentType";
import { validateResponse } from "./validation";
import { toApiError } from "./errorAdapter";
import { envConfig } from "../config";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RequestOptions<TResponse> {
  schema?: ZodType<TResponse>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
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
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      schema?: ZodType<TResponse>;
    },
  ): Promise<TResponse | unknown> {
    const url = this.buildUrl(path);
    const queryParams = options?.queryParams;
    const body = options?.body;
    const headers = {
      ...options?.headers,
      "Content-Type": resolveContentType(body),
    };
    const schema = options?.schema;

    try {
      const response = await this.client.request({
        url,
        method,
        params: queryParams,
        data: body,
        headers,
      });

      if (schema) {
        return validateResponse(schema, response.data);
      }

      return response.data as unknown;
    } catch (error) {
      throw toApiError(error);
    }
  }

  public async get<TResponse>(path: string, options?: RequestOptions<TResponse>): Promise<TResponse | unknown> {
    return this.request<TResponse>("get", path, {
      headers: options?.headers,
      queryParams: options?.queryParams,
      schema: options?.schema,
    });
  }

  public async post<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("post", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
      schema: options?.schema,
    });
  }

  public async put<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("put", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
      schema: options?.schema,
    });
  }

  public async patch<TResponse>(
    path: string,
    body: unknown,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("patch", path, {
      body,
      headers: options?.headers,
      queryParams: options?.queryParams,
      schema: options?.schema,
    });
  }

  public async delete<TResponse>(
    path: string,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse | unknown> {
    return this.request<TResponse>("delete", path, {
      headers: options?.headers,
      queryParams: options?.queryParams,
      schema: options?.schema,
    });
  }
}

class RootBaseService extends BaseService {
  constructor() {
    super({ basePath: envConfig.apiBaseUrl });
  }
}

export const baseService = new RootBaseService();
`;
}
