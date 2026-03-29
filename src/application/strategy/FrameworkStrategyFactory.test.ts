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
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const strategy = factory.create(context);
  assert.ok(strategy.supports("react"));
});

test("FrameworkStrategyFactory resolves vue when registered", () => {
  const factory = new FrameworkStrategyFactory([
    new FakeStrategy("react"),
    new FakeStrategy("vue"),
  ]);
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "fsd",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "vue-router",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  const strategy = factory.create(context);
  assert.ok(strategy.supports("vue"));
});

test("FrameworkStrategyFactory throws on missing strategy", () => {
  const factory = new FrameworkStrategyFactory([new FakeStrategy("react")]);
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "nextjs",
      architecture: "fsd",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "nextjs",
  });

  assert.throws(() => factory.create(context));
});

