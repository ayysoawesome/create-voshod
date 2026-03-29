export function queryClientSource(framework: "react" | "vue"): string {
  const pkg =
    framework === "vue" ? "@tanstack/vue-query" : "@tanstack/react-query";
  return `import { QueryClient } from "${pkg}";
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
