import { test } from "node:test";
import assert from "node:assert/strict";
import { FrameworkStrategyFactory } from "./FrameworkStrategyFactory.js";
import { FrameworkStrategy } from "./FrameworkStrategy.js";
import { GenerationContext } from "@/domain/generation/index.js";

class FakeStrategy implements FrameworkStrategy {
  constructor(private readonly value: string) {}
  supports(framework: string): boolean {
    return framework === this.value;
  }
  createSteps() {
    return [];
  }
}

test("FrameworkStrategyFactory returns matching strategy", () => {
  const factory = new FrameworkStrategyFactory([new FakeStrategy("react")]);
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
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

  const strategy = factory.create(context);
  assert.ok(strategy.supports("react"));
});

test("FrameworkStrategyFactory throws on missing strategy", () => {
  const factory = new FrameworkStrategyFactory([new FakeStrategy("react")]);
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "fsd",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  assert.throws(() => factory.create(context));
});

