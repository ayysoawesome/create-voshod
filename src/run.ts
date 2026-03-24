import { CliApplication } from "@/presentation/cli/app/CliApplication.js";

/**
 * Creates and runs CLI application instance.
 *
 * @returns Promise resolved after CLI flow completes.
 */
export async function run() {
  const app = new CliApplication();
  await app.run();
}
