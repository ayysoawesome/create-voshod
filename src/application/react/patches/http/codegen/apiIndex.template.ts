export function indexApiSource(
  httpClient: "axios" | "ofetch" | null,
  useTanStackQuery: boolean,
  withValidation: boolean,
): string {
  const queryExport = useTanStackQuery
    ? `export { queryClient } from "./queryClient";
`
    : "";
  const validationExport = withValidation
    ? `export { validateResponse } from "./validation";
`
    : "";
  const httpExport =
    httpClient === null
      ? `export { httpClient } from "./httpClient";
`
      : "";
  const axiosExport =
    httpClient === "axios"
      ? `export { baseAxiosInstance } from "./axios";
`
      : "";
  return `${queryExport}export { baseService } from "./baseService";
export { ApiError, isApiError } from "./errors";
export { toApiError } from "./errorAdapter";
${validationExport}${httpExport}${axiosExport}`;
}
