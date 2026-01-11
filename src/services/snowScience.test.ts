import { describe, expect, it } from "vitest";
import {
  calculateManpower,
  calculateNetAccumulation,
  calculateRainMelting,
  calculateSolarMelting,
  getSaltRecommendation,
  RAIN_SNOW_MELT_RATIO,
  shouldShovelMidStorm,
  SNOW_THRESHOLDS,
} from "./snowScience";

describe("Snow Science Knowledge Base", () => {
  describe("calculateRainMelting", () => {
    it("should melt snow at correct ratio (1mm rain = 10mm snow)", () => {
      expect(calculateRainMelting(1)).toBe(RAIN_SNOW_MELT_RATIO);
      expect(calculateRainMelting(5)).toBe(50);
      expect(calculateRainMelting(0)).toBe(0);
    });
  });

  describe("calculateSolarMelting", () => {
    it("should return 0 when below freezing", () => {
      expect(calculateSolarMelting(-5, 0, 1, true)).toBe(0);
    });

    it("should return 0 at night", () => {
      expect(calculateSolarMelting(5, 0, 1, false)).toBe(0);
    });

    it("should melt more with higher temps and clear skies", () => {
      const lowTemp = calculateSolarMelting(3, 20, 1, true);
      const highTemp = calculateSolarMelting(12, 20, 1, true);
      expect(highTemp).toBeGreaterThan(lowTemp);
    });

    it("should melt less with cloud cover", () => {
      const clearSky = calculateSolarMelting(5, 0, 1, true);
      const cloudy = calculateSolarMelting(5, 80, 1, true);
      expect(clearSky).toBeGreaterThan(cloudy);
    });
  });

  describe("calculateManpower", () => {
    it("should estimate faster clearing for light snow", () => {
      const light = calculateManpower(50, 30);
      const heavy = calculateManpower(50, 150);
      expect(light).toBeLessThan(heavy);
    });

    it("should scale with area", () => {
      const smallArea = calculateManpower(25, 50);
      const largeArea = calculateManpower(100, 50);
      expect(largeArea).toBeGreaterThan(smallArea);
    });

    it("should return integer minutes", () => {
      const result = calculateManpower(50, 75);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe("calculateNetAccumulation", () => {
    it("should subtract rain melting and solar melting from snowfall", () => {
      const net = calculateNetAccumulation(100, 5, 10);
      // 100 snow - (5 rain * 10 ratio) - 10 solar = 40
      expect(net).toBe(40);
    });

    it("should never return negative", () => {
      const net = calculateNetAccumulation(10, 10, 10);
      expect(net).toBe(0);
    });
  });

  describe("shouldShovelMidStorm", () => {
    it("should return true above threshold", () => {
      expect(shouldShovelMidStorm(SNOW_THRESHOLDS.veryHeavy + 1)).toBe(true);
    });

    it("should return false below threshold", () => {
      expect(shouldShovelMidStorm(SNOW_THRESHOLDS.veryHeavy - 1)).toBe(false);
    });
  });

  describe("getSaltRecommendation", () => {
    it("should recommend salt when temps will drop below freezing", () => {
      const result = getSaltRecommendation(5, -3, true);
      expect(result.shouldApply).toBe(true);
    });

    it("should not recommend salt when too cold", () => {
      const result = getSaltRecommendation(-20, -25, true);
      expect(result.shouldApply).toBe(false);
      expect(result.reason).toContain("Too cold");
    });

    it("should not recommend salt when no freeze expected", () => {
      const result = getSaltRecommendation(5, 3, false);
      expect(result.shouldApply).toBe(false);
    });
  });
});
