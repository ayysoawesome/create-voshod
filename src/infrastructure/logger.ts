import chalk from "chalk";
import { ILogger } from "@/domain/ports/index.js";

/**
 * Legacy-compatible logger shape retained for internal exports.
 */
export interface Logger {
  info(message: string): void;
  success(message: string): void;
  error(message: string): void;
}

/**
 * Console logger with colored output for CLI UX.
 */
export class ConsoleLoggerService implements Logger, ILogger {
  /**
   * @param message Message to print in info color.
   */
  info(message: string): void {
    console.log(chalk.cyan(message));
  }

  /**
   * @param message Message to print in success color.
   */
  success(message: string): void {
    console.log(chalk.green(message));
  }

  /**
   * @param message Message to print in error color.
   */
  error(message: string): void {
    console.log(chalk.red(message));
  }
}

/**
 * Backward-compatible singleton logger export.
 */
export const consoleLogger: Logger = new ConsoleLoggerService();

