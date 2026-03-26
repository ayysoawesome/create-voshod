import type { ValidationCodegenKind } from "./validationProfile.js";

export function ofetchBaseServiceSource(kind: ValidationCodegenKind): string {
  if (kind === "none") {
    return `import { resolveContentType } from "./resolveContentType";
import { toApiError } from "./errorAdapter";
import { ofetch } from "ofetch";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RequestOptions {
  headers?: Record<string, string>;
}

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

  protected async request<TResponse = unknown>(
    method: HttpMethod,
    path: string,
    options?: {
      body?: BodyInit | Record<string, unknown>;
      headers?: Record<string, string>;
    },
  ): Promise<TResponse> {
    const url = this.buildUrl(path);
    const body = options?.body;
    const contentType = resolveContentType(body);
    const headers = options?.headers;

    const response = await ofetch<TResponse>(url, {
      method,
      body,
      headers: {
        "Content-Type": contentType,
        ...headers,
      },
    }).catch((error) => {
      throw toApiError(error);
    });

    return response;
  }

  public async get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>("get", path, {
      headers: options?.headers,
    });
  }

  public async post<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>("post", path, {
      body,
      headers: options?.headers,
    });
  }

  public async put<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>("put", path, {
      body,
      headers: options?.headers,
    });
  }

  public async patch<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>("patch", path, {
      body,
      headers: options?.headers,
    });
  }

  public async delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>("delete", path, {
      headers: options?.headers,
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

  return `import type { ZodType } from "zod";
import { resolveContentType } from "./resolveContentType";
import { validateResponse } from "./validation";
import { toApiError } from "./errorAdapter";
import { ofetch } from "ofetch";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RequestOptions<TResponse> {
  schema?: ZodType<TResponse>;
  headers?: Record<string, string>;
}

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

  protected async request<TResponse = unknown>(
    method: HttpMethod,
    path: string,
    options?: {
      body?: BodyInit | Record<string, unknown>;
      schema?: ZodType<TResponse>;
      headers?: Record<string, string>;
    },
  ): Promise<TResponse> {
    const url = this.buildUrl(path);
    const body = options?.body;
    const contentType = resolveContentType(body);
    const schema = options?.schema;
    const headers = options?.headers;

    const response = await ofetch<TResponse>(url, {
      method,
      body,
      headers: {
        "Content-Type": contentType,
        ...headers,
      },
    }).catch((error) => {
      throw toApiError(error);
    });

    if (schema) {
      try {
        return validateResponse<TResponse>(schema, response);
      } catch (error) {
        throw toApiError(error);
      }
    } else return response;
  }

  public async get<TResponse>(path: string, options?: RequestOptions<TResponse>): Promise<TResponse> {
    return this.request<TResponse>("get", path, {
      headers: options?.headers,
      schema: options?.schema,
    });
  }

  public async post<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse> {
    return this.request<TResponse>("post", path, {
      body,
      headers: options?.headers,
      schema: options?.schema,
    });
  }

  public async put<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse> {
    return this.request<TResponse>("put", path, {
      body,
      headers: options?.headers,
      schema: options?.schema,
    });
  }

  public async patch<TResponse>(
    path: string,
    body: BodyInit | Record<string, unknown>,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse> {
    return this.request<TResponse>("patch", path, {
      body,
      headers: options?.headers,
      schema: options?.schema,
    });
  }

  public async delete<TResponse>(
    path: string,
    options?: RequestOptions<TResponse>,
  ): Promise<TResponse> {
    return this.request<TResponse>("delete", path, {
      headers: options?.headers,
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

