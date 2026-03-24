export function resolveContentTypeSource(): string {
  return `export const resolveContentType = <TBody = unknown>(body: TBody): string => {
  if (body === undefined || body === null) {
    return "application/json";
  }

  if (body instanceof FormData) {
    return "multipart/form-data";
  }

  if (body instanceof URLSearchParams) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }

  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }

  if (
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return "application/octet-stream";
  }

  if (typeof body === "object" && body !== null) {
    return "application/json";
  }

  return "text/plain;charset=UTF-8";
};
`;
}
