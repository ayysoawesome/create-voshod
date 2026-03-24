export function indexApiSource(
  axiosMode: boolean,
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
  const httpExport = axiosMode
    ? ""
    : `export { httpClient } from "./httpClient";
`;
  const axiosExport = axiosMode
    ? `export { baseAxiosInstance } from "./axios";
`
    : "";
  return `${queryExport}export { baseService } from "./baseService";
export { ApiError, isApiError } from "./errors";
export { toApiError } from "./errorAdapter";
${validationExport}${httpExport}${axiosExport}`;
}
