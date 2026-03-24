import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

/**
 * Generates the shared API layer: errors, retry, query client, HTTP transport (fetch or axios), base service.
 * Paths follow {@link resolveReactLayoutProfile} (`src/api` vs `src/shared/api`).
 */
export class SharedApiPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const root = profile.apiRoot;
    const axiosMode = context.options.value.httpClient === "axios";
    const useTanStackQuery = context.options.value.tanstackQuery;
    const useZod = context.options.value.validationLibrary === "zod";

    composer.upsertFile(`${root}/errors.ts`, errorsSource(axiosMode, useZod));

    if (useTanStackQuery) {
      composer.upsertFile(`${root}/retry.ts`, retrySource());
      composer.upsertFile(`${root}/queryClient.ts`, queryClientSource());
    }

    const queryExport = useTanStackQuery
      ? `export { queryClient } from "./queryClient";
`
      : "";

    if (axiosMode) {
      composer.upsertFile(`${root}/axios.ts`, axiosHttpSource());
      composer.upsertFile(`${root}/baseService.ts`, axiosBaseServiceSource(useZod));
      composer.upsertFile(
        `${root}/index.ts`,
        `${queryExport}export { baseService } from "./baseService";
export { ApiError, toApiError, isApiError } from "./errors";
export { baseAxiosInstance } from "./axios";
`,
      );
    } else {
      composer.upsertFile(`${root}/httpClient.ts`, fetchHttpSource());
      composer.upsertFile(`${root}/baseService.ts`, fetchBaseServiceSource(useZod));
      composer.upsertFile(
        `${root}/index.ts`,
        `${queryExport}export { baseService } from "./baseService";
export { ApiError, toApiError, isApiError } from "./errors";
export { httpClient } from "./httpClient";
`,
      );
    }
  }
}

function errorsSource(axiosMode: boolean, useZod: boolean): string {
  const axiosImports = axiosMode
    ? `import type { AxiosError } from "axios";
import { isAxiosError } from "axios";
`
    : "";

  const axiosBranch = axiosMode
    ? `
const fromAxiosError = (error: AxiosError<unknown>): ApiError => {
  const status = error.response?.status;
  const code = error.code;
  const details = error.response?.data;
  const kind: ApiErrorKind = typeof status === "number" ? "http" : "network";
  return new ApiError({
    message: error.message,
    kind,
    status,
    code: typeof code === "string" ? code : undefined,
    details,
  });
};
`
    : "";

  const toApiErrorBody = axiosMode
    ? `  if (isAxiosError(error)) {
    return fromAxiosError(error);
  }

`
    : `  if (typeof Response !== "undefined" && error instanceof Response) {
    return new ApiError({
      message: error.statusText || "HTTP error",
      kind: "http",
      status: error.status,
    });
  }

`;

  if (!useZod) {
    return `${axiosImports}
export type ApiErrorKind = "network" | "http" | "unknown";

export interface ApiErrorParams {
  message: string;
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
${axiosBranch}
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

${toApiErrorBody}  if (error instanceof Error) {
    return new ApiError({ message: error.message, kind: "unknown" });
  }

  return new ApiError({ message: "Unknown error", kind: "unknown", details: error });
};

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
`;
  }

  return `import type { ZodType } from "zod";
import { ZodError } from "zod";
${axiosImports}
export type ApiErrorKind = "network" | "http" | "validation" | "unknown";

export interface ApiErrorParams {
  message: string;
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
${axiosBranch}
const fromZodError = (error: ZodError<unknown>): ApiError =>
  new ApiError({
    message: "Response validation failed",
    kind: "validation",
    details: error.flatten(),
  });

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

${toApiErrorBody}  if (error instanceof ZodError) {
    return fromZodError(error);
  }

  if (error instanceof Error) {
    return new ApiError({ message: error.message, kind: "unknown" });
  }

  return new ApiError({ message: "Unknown error", kind: "unknown", details: error });
};

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const validateResponse = <T>(schema: ZodType<T>, data: unknown): T => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw fromZodError(parsed.error);
  }
  return parsed.data;
};
`;
}

function retrySource(): string {
  return `import type { ApiError } from "./errors";
import { isApiError, toApiError } from "./errors";

export const shouldRetryApiError = (
  failureCount: number,
  error: unknown,
  maxRetries: number = 3,
): boolean => {
  const apiError: ApiError = isApiError(error) ? error : toApiError(error);

  if (failureCount >= maxRetries) {
    return false;
  }

  if (apiError.kind === "validation") {
    return false;
  }

  if (
    apiError.kind === "http" &&
    apiError.status !== undefined &&
    apiError.status >= 400 &&
    apiError.status < 500
  ) {
    return false;
  }

  return true;
};
`;
}

function queryClientSource(): string {
  return `import { QueryClient } from "@tanstack/react-query";
import { shouldRetryApiError } from "./retry";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => shouldRetryApiError(failureCount, error),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: false,
    },
  },
});
`;
}

function axiosHttpSource(): string {
  return `import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { envConfig } from "../config";

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
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

function axiosBaseServiceSource(useZod: boolean): string {
  if (!useZod) {
    return `import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { baseAxiosInstance } from "./axios";
import { ApiError, toApiError } from "./errors";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;

export interface RequestOptions<TResponse, TBody = unknown> {
  config?: RequestConfig<TBody>;
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

  protected async request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options?: { body?: TBody; config?: RequestConfig<TBody> },
  ): Promise<TResponse> {
    const url = this.buildUrl(path);
    const config = options?.config;

    try {
      let response: AxiosResponse<TResponse>;
      switch (method) {
        case "get":
          response = await this.client.get(url, config);
          break;
        case "delete":
          response = await this.client.delete(url, config);
          break;
        case "post":
          response = await this.client.post(url, options?.body, config);
          break;
        case "put":
          response = await this.client.put(url, options?.body, config);
          break;
        case "patch":
          response = await this.client.patch(url, options?.body, config);
          break;
        default:
          throw new ApiError({ message: \`Unsupported HTTP method: \${method}\`, kind: "unknown" });
      }

      return response.data as TResponse;
    } catch (error) {
      throw toApiError(error);
    }
  }

  protected get<TResponse>(path: string, options?: RequestOptions<TResponse, undefined>): Promise<TResponse> {
    return this.request<TResponse, undefined>("get", path, {
      config: options?.config,
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

  return `import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { baseAxiosInstance } from "./axios";
import type { ZodType } from "zod";
import { ApiError, toApiError, validateResponse } from "./errors";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RequestConfig<TData = unknown> = AxiosRequestConfig<TData>;

export interface RequestOptions<TResponse, TBody = unknown> {
  config?: RequestConfig<TBody>;
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

  protected async request<TResponse, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options?: { body?: TBody; config?: RequestConfig<TBody>; schema?: ZodType<TResponse> },
  ): Promise<TResponse> {
    const url = this.buildUrl(path);
    const config = options?.config;
    const schema = options?.schema;

    try {
      let response: AxiosResponse<TResponse>;
      switch (method) {
        case "get":
          response = await this.client.get(url, config);
          break;
        case "delete":
          response = await this.client.delete(url, config);
          break;
        case "post":
          response = await this.client.post(url, options?.body, config);
          break;
        case "put":
          response = await this.client.put(url, options?.body, config);
          break;
        case "patch":
          response = await this.client.patch(url, options?.body, config);
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

  protected get<TResponse>(path: string, options?: RequestOptions<TResponse, undefined>): Promise<TResponse> {
    return this.request<TResponse, undefined>("get", path, {
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

function fetchHttpSource(): string {
  return `import { envConfig } from "../config";
import { ApiError } from "./errors";

const joinUrl = (base: string, path: string): string => {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : \`/\${path}\`;
  return \`\${b}\${p}\`;
};

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError({
      message: response.statusText || "Request failed",
      kind: "http",
      status: response.status,
    });
  }
  return response.json() as Promise<T>;
}

export const httpClient = {
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const url = joinUrl(envConfig.apiBaseUrl, path);
    const response = await fetch(url, {
      ...init,
      method: "GET",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    return readResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = joinUrl(envConfig.apiBaseUrl, path);
    const response = await fetch(url, {
      ...init,
      method: "POST",
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return readResponse<T>(response);
  },
};
`;
}

function fetchBaseServiceSource(useZod: boolean): string {
  if (!useZod) {
    return `import { httpClient } from "./httpClient";
import { toApiError } from "./errors";

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

  protected async get<TResponse>(path: string): Promise<TResponse> {
    try {
      const url = this.buildUrl(path);
      const data = await httpClient.get<unknown>(url);
      return data as TResponse;
    } catch (error) {
      throw toApiError(error);
    }
  }

  protected async post<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    try {
      const url = this.buildUrl(path);
      const data = await httpClient.post<unknown>(url, body);
      return data as TResponse;
    } catch (error) {
      throw toApiError(error);
    }
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
import { ApiError, toApiError, validateResponse } from "./errors";

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

  protected async get<TResponse>(path: string, schema?: ZodType<TResponse>): Promise<TResponse> {
    try {
      const url = this.buildUrl(path);
      const data = await httpClient.get<unknown>(url);
      if (schema) {
        return validateResponse(schema, data);
      }
      return data as TResponse;
    } catch (error) {
      throw toApiError(error);
    }
  }

  protected async post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    schema?: ZodType<TResponse>,
  ): Promise<TResponse> {
    try {
      const url = this.buildUrl(path);
      const data = await httpClient.post<unknown>(url, body);
      if (schema) {
        return validateResponse(schema, data);
      }
      return data as TResponse;
    } catch (error) {
      throw toApiError(error);
    }
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
