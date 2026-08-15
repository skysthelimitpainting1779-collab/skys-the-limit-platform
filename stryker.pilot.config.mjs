const strykerConfig = {
  mutate: ["src/lib/leads/intakeProof.ts"],
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { related: false, configFile: "vitest.config.mts" },
  reporters: ["clear-text", "json"],
  jsonReporter: { fileName: "test-results/stryker-pilot.json" },
  coverageAnalysis: "perTest",
  concurrency: 2,
  timeoutMS: 20_000,
  thresholds: { high: 90, low: 80, break: null },
  tempDirName: "node_modules/.cache/stryker-tmp",
};

export default strykerConfig;
