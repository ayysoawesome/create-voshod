import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerateProjectUseCase } from "./GenerateProjectUseCase.js";
import { FrameworkStrategyFactory } from "../strategy/FrameworkStrategyFactory.js";
import { FrameworkStrategy } from "../strategy/FrameworkStrategy.js";
import { GenerationContext } from "@/domain/generation/index.js";

class FakeLogger {
  public successMessages: string[] = [];
  public infoMessages: string[] = [];
  info(message: string): void {
    this.infoMessages.push(message);
  }
  error(): void {}
  success(message: string): void {
    this.successMessages.push(message);
  }
}

class FakeStep {
  constructor(private readonly marker: { executed: number }) {}
  async execute(): Promise<void> {
    this.marker.executed += 1;
  }
}

class FakeStrategy implements FrameworkStrategy {
  constructor(private readonly marker: { executed: number }) {}
  supports(framework: string): boolean {
    return framework === "react";
  }
  createSteps() {
    return [new FakeStep(this.marker)];
  }
}

test("GenerateProjectUseCase executes strategy steps", async () => {
  const marker = { executed: 0 };
  const logger = new FakeLogger();
  const factory = new FrameworkStrategyFactory([new FakeStrategy(marker)]);
  const useCase = new GenerateProjectUseCase(factory, logger);
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  await useCase.execute(context);
  assert.equal(marker.executed, 1);
  assert.equal(logger.successMessages.length, 1);
  assert.equal(logger.infoMessages.length, 1);
  assert.ok(logger.infoMessages[0]?.includes("github.com/ayysoawesome/create-voshod"));
});

