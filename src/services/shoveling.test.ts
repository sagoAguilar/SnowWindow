import { describe, expect, it } from "vitest";
import { generateRecommendation } from "./shoveling";
import { MockWeatherAdapter } from "./weather/mockWeather";
import { PRESET_SCENARIOS } from "./scenarios";

describe("generateRecommendation - New Scenarios", () => {
  it("should recommend shoveling when snowplow pile is reported (even with low natural snowfall)", async () => {
    // Scenario: Light natural snowfall (5mm), but snowplow pile present
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "snowplow-pile");
    expect(scenario).toBeDefined();

    const adapter = new MockWeatherAdapter(scenario!.params);
    const weather = await adapter.fetchWeather({ latitude: 44.7208, longitude: -63.6805 });

    // Without snowplow pile - should say no shoveling
    const recWithoutPile = generateRecommendation(weather, 50);
    expect(recWithoutPile.shouldShovel).toBe(false);

    // With snowplow pile - should recommend shoveling
    const recWithPile = generateRecommendation(weather, 50, undefined, 50);
    expect(recWithPile.shouldShovel).toBe(true);
    expect(recWithPile.snowplowPileDetected).toBe(true);
    expect(recWithPile.message).toContain("Snowplow pile");
  });

  it("should recommend shoveling for overnight accumulation blocking morning car departure", async () => {
    // Scenario: 8mm overnight accumulation (below 10mm threshold normally)
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "overnight-car-blocked");
    expect(scenario).toBeDefined();

    const adapter = new MockWeatherAdapter(scenario!.params);
    const weather = await adapter.fetchWeather({ latitude: 44.7208, longitude: -63.6805 });

    // Without car departure time - should say no shoveling (below threshold)
    const recWithoutDeparture = generateRecommendation(weather, 50);
    expect(recWithoutDeparture.shouldShovel).toBe(false);

    // With car departure time - should recommend shoveling
    const recWithDeparture = generateRecommendation(weather, 50, undefined, undefined, "07:00");
    expect(recWithDeparture.shouldShovel).toBe(true);
    expect(recWithDeparture.blocksDriveway).toBe(true);
    expect(recWithDeparture.message).toContain("driveway");
  });

  it("should recommend cleanup when rain follows snow (slush warning)", async () => {
    // Scenario: Snow followed by rain creates slush
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "rain-after-snow-slush");
    expect(scenario).toBeDefined();

    const adapter = new MockWeatherAdapter(scenario!.params);
    const weather = await adapter.fetchWeather({ latitude: 44.7208, longitude: -63.6805 });

    const rec = generateRecommendation(weather, 50);
    expect(rec.slushWarning).toBe(true);
    expect(rec.reasoning.some(r => r.includes("rain") || r.includes("slush"))).toBe(true);
  });

  it("should prioritize snowplow pile over other conditions", async () => {
    // Even with low natural snow, snowplow pile should trigger recommendation
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "clear-no-action");
    expect(scenario).toBeDefined();

    const adapter = new MockWeatherAdapter(scenario!.params);
    const weather = await adapter.fetchWeather({ latitude: 44.7208, longitude: -63.6805 });

    // Clear weather + snowplow pile = should shovel
    const rec = generateRecommendation(weather, 50, undefined, 100);
    expect(rec.shouldShovel).toBe(true);
    expect(rec.snowplowPileDetected).toBe(true);
  });

  it("should handle multiple conditions simultaneously", async () => {
    // Snow + car departure time + slush warning
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "rain-after-snow-slush");
    expect(scenario).toBeDefined();

    const adapter = new MockWeatherAdapter(scenario!.params);
    const weather = await adapter.fetchWeather({ latitude: 44.7208, longitude: -63.6805 });

    const rec = generateRecommendation(weather, 50, undefined, undefined, "07:00");
    expect(rec.shouldShovel).toBe(true);
    // Should have slush warning since it's snow + rain
    expect(rec.slushWarning).toBe(true);
  });
});
