import { describe, expect, it } from "vitest";
import {
  adjustShovelWindowForWind,
  calculateEffortMultiplier,
  calculateManpower,
  calculateNetAccumulation,
  calculateRainMelting,
  calculateSnowDensity,
  calculateSolarMelting,
  calculateWindChill,
  calculateWindCompactionFactor,
  getSaltRecommendation,
  getSnowTypeDescription,
  RAIN_SNOW_MELT_RATIO,
  shouldShovelMidStorm,
  SNOW_DENSITY,
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
      const result = getSaltRecommendation(5, -3, true, 0, false);
      expect(result.shouldApply).toBe(true);
    });

    it("should not recommend salt when too cold", () => {
      const result = getSaltRecommendation(-20, -25, true, 0, false);
      expect(result.shouldApply).toBe(false);
      expect(result.reason).toContain("Too cold");
    });

    it("should not recommend salt when no freeze expected and clear", () => {
      const result = getSaltRecommendation(5, 3, false, 0, false);
      expect(result.shouldApply).toBe(false);
    });

    it("should not apply during heavy rain", () => {
      const result = getSaltRecommendation(2, -5, true, 5, false); // 5mm/h rain
      expect(result.shouldApply).toBe(false);
      expect(result.waitForRain).toBe(true);
    });

    it("should warn to wait if rain then freeze", () => {
      const result = getSaltRecommendation(5, -3, false, 0, true); // rain expected
      expect(result.reason).toContain("after rain");
      expect(result.waitForRain).toBe(true);
    });

    it("should not apply when rain expected and no freeze", () => {
      const result = getSaltRecommendation(5, 5, false, 0, true);
      expect(result.shouldApply).toBe(false);
      expect(result.reason).toContain("no freeze");
    });
  });

  describe("calculateWindChill", () => {
    it("should return actual temp when wind is low", () => {
      expect(calculateWindChill(-5, 3)).toBe(-5); // Below 4.8 km/h threshold
    });

    it("should return actual temp when temp is above 10°C", () => {
      expect(calculateWindChill(15, 20)).toBe(15);
    });

    it("should calculate lower wind chill with higher wind", () => {
      const lowWind = calculateWindChill(-5, 10);
      const highWind = calculateWindChill(-5, 40);
      expect(highWind).toBeLessThan(lowWind);
    });

    it("should calculate lower wind chill with lower temp", () => {
      const warmish = calculateWindChill(0, 20);
      const cold = calculateWindChill(-10, 20);
      expect(cold).toBeLessThan(warmish);
    });
  });

  describe("calculateWindCompactionFactor", () => {
    it("should return 1 for calm wind", () => {
      expect(calculateWindCompactionFactor(5)).toBe(1);
    });

    it("should return higher factor for stronger wind", () => {
      const calm = calculateWindCompactionFactor(5);
      const strong = calculateWindCompactionFactor(45);
      expect(strong).toBeGreaterThan(calm);
    });

    it("should return 2 for severe wind", () => {
      expect(calculateWindCompactionFactor(65)).toBe(2);
    });
  });

  describe("adjustShovelWindowForWind", () => {
    it("should not change window for calm wind", () => {
      expect(adjustShovelWindowForWind(2, 5)).toBe(2);
    });

    it("should shorten window for strong wind", () => {
      const adjusted = adjustShovelWindowForWind(2, 45);
      expect(adjusted).toBeLessThan(2);
    });

    it("should never go below 0.5 hours", () => {
      const adjusted = adjustShovelWindowForWind(2, 100);
      expect(adjusted).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe("calculateSnowDensity", () => {
    it("should return light powder for very cold temps", () => {
      const density = calculateSnowDensity(-20, 5);
      expect(density).toBe(SNOW_DENSITY.lightPowder);
    });

    it("should return fresh snow for cold temps", () => {
      const density = calculateSnowDensity(-10, 5);
      expect(density).toBe(SNOW_DENSITY.freshSnow);
    });

    it("should return dense snow for moderate cold temps", () => {
      const density = calculateSnowDensity(-5, 5);
      expect(density).toBe(SNOW_DENSITY.denseSnow);
    });

    it("should return wet heavy snow near freezing", () => {
      const density = calculateSnowDensity(-1, 5);
      expect(density).toBe(SNOW_DENSITY.wetHeavy);
    });

    it("should increase density with strong wind", () => {
      const calmDensity = calculateSnowDensity(-10, 5);
      const windyDensity = calculateSnowDensity(-10, 50);
      expect(windyDensity).toBeGreaterThan(calmDensity);
    });

    it("should return slush density when rain is mixed", () => {
      const density = calculateSnowDensity(-5, 10, true);
      expect(density).toBe(SNOW_DENSITY.slush);
    });

    it("should cap density at packed snow level", () => {
      // Very windy wet snow shouldn't exceed packed density
      const density = calculateSnowDensity(-1, 80);
      expect(density).toBeLessThanOrEqual(SNOW_DENSITY.packed);
    });

    it("should calculate Bedford-like conditions (near freezing + high wind)", () => {
      // Bedford, NS scenario: ~-2°C with 70-80 km/h wind
      const density = calculateSnowDensity(-2, 75);
      // Should be wet/heavy (350) * 1.5 wind factor = 525, capped at 450
      expect(density).toBe(SNOW_DENSITY.packed);
    });
  });

  describe("calculateEffortMultiplier", () => {
    it("should return 1.0 for fresh snow baseline", () => {
      const multiplier = calculateEffortMultiplier(SNOW_DENSITY.freshSnow);
      expect(multiplier).toBe(1);
    });

    it("should return ~1.4 for dense snow (200 kg/m³)", () => {
      const multiplier = calculateEffortMultiplier(SNOW_DENSITY.denseSnow);
      expect(multiplier).toBeCloseTo(1.41, 1); // sqrt(2) ≈ 1.41
    });

    it("should return ~2.0 for very dense snow (400 kg/m³)", () => {
      const multiplier = calculateEffortMultiplier(400);
      expect(multiplier).toBeCloseTo(2.0, 1);
    });

    it("should never return less than 1.0", () => {
      const multiplier = calculateEffortMultiplier(SNOW_DENSITY.lightPowder);
      expect(multiplier).toBeGreaterThanOrEqual(1.0);
    });

    it("should show significant increase for packed snow", () => {
      const multiplier = calculateEffortMultiplier(SNOW_DENSITY.packed);
      expect(multiplier).toBeGreaterThan(2.0);
    });
  });

  describe("getSnowTypeDescription", () => {
    it("should describe light powder", () => {
      const desc = getSnowTypeDescription(SNOW_DENSITY.lightPowder);
      expect(desc).toBe("light powder");
    });

    it("should describe fresh snow", () => {
      const desc = getSnowTypeDescription(SNOW_DENSITY.freshSnow);
      expect(desc).toBe("fresh snow");
    });

    it("should describe dense snow", () => {
      const desc = getSnowTypeDescription(SNOW_DENSITY.denseSnow);
      expect(desc).toBe("dense snow");
    });

    it("should describe wet/heavy snow", () => {
      const desc = getSnowTypeDescription(SNOW_DENSITY.wetHeavy);
      expect(desc).toBe("wet/heavy snow");
    });

    it("should describe packed/icy snow", () => {
      const desc = getSnowTypeDescription(SNOW_DENSITY.packed);
      expect(desc).toBe("packed/icy snow");
    });
  });
});
