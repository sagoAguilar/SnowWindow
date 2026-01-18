import type {
  SaltAdvice,
  ShovelingRecommendation,
  UrgencyLevel,
  WeatherData,
} from "../types";
import {
  adjustShovelWindowForWind,
  calculateManpower,
  calculateNetAccumulation,
  calculateSolarMelting,
  COMPACTION_FREEZE_TEMP,
  getSaltRecommendation,
  OPTIMAL_SHOVEL_WINDOW_HOURS,
  shouldShovelMidStorm,
  SNOW_THRESHOLDS,
  WIND_THRESHOLDS,
} from "./snowScience";

/**
 * Generate shoveling recommendation from weather data.
 * This is the main algorithm that combines all snow science factors.
 */
export function generateRecommendation(
  weather: WeatherData,
  areaSquareMeters: number = 50, // Default: typical driveway
): ShovelingRecommendation {
  const now = new Date();
  const reasoning: string[] = [];

  // Get next 24 hours of forecast
  const next24Hours = weather.hourly.filter((h) => {
    const hoursDiff = (h.time.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 0 && hoursDiff <= 24;
  });

  // Calculate totals
  let totalSnowfall = 0;
  let totalRain = 0;
  let totalSolarMelt = 0;
  let snowStopTime: Date | null = null;
  let lastSnowHour: Date | null = null;

  for (const hour of next24Hours) {
    totalSnowfall += hour.snowfall;
    totalRain += hour.rain;

    // Track when snow stops
    if (hour.snowfall > 0) {
      lastSnowHour = hour.time;
    }

    // Calculate solar melting for each hour
    if (hour.isDay && hour.temperature > 0) {
      totalSolarMelt += calculateSolarMelting(
        hour.temperature,
        hour.cloudCover,
        1, // 1 hour
        hour.isDay,
      );
    }
  }

  // Snow stops at the hour after last snowfall
  if (lastSnowHour) {
    snowStopTime = new Date(lastSnowHour.getTime() + 60 * 60 * 1000);
  }

  // Calculate net accumulation
  const netAccumulation = calculateNetAccumulation(
    totalSnowfall,
    totalRain,
    totalSolarMelt,
  );

  // Find when temperature will drop below freezing (compaction risk)
  const freezeTime = next24Hours.find(
    (h) => h.time > now && h.temperature < COMPACTION_FREEZE_TEMP,
  )?.time;

  // Find minimum temperature for salt advice
  const minTemp = Math.min(...next24Hours.map((h) => h.temperature));

  // Calculate average wind speed for next 24 hours
  const avgWindSpeed =
    next24Hours.length > 0
      ? next24Hours.reduce((sum, h) => sum + h.windSpeed, 0) /
        next24Hours.length
      : 0;

  // Determine urgency and recommendation
  let urgency: UrgencyLevel = "none";
  let shouldShovel = false;
  let optimalTime: Date | undefined;
  let message = "";

  // Check if should shovel mid-storm
  if (weather.current.snowfall > 0 && shouldShovelMidStorm(netAccumulation)) {
    urgency = "urgent";
    shouldShovel = true;
    optimalTime = now;
    message = "Heavy snowfall - shovel now to prevent buildup!";
    reasoning.push(
      `Accumulation exceeds ${SNOW_THRESHOLDS.veryHeavy}mm threshold.`,
    );
  }
  // No snow expected or negligible
  else if (netAccumulation < SNOW_THRESHOLDS.negligible) {
    urgency = "none";
    shouldShovel = false;
    message = "No shoveling needed.";
    if (totalSnowfall > 0) {
      reasoning.push(
        `Light snow (${totalSnowfall.toFixed(1)}mm) will melt naturally.`,
      );
    } else {
      reasoning.push("No significant snow in forecast.");
    }
  }
  // Light snow - optional
  else if (netAccumulation < SNOW_THRESHOLDS.light) {
    urgency = "low";
    shouldShovel = false;
    message = "Light dusting expected - shoveling optional.";
    reasoning.push(
      `Expected: ${netAccumulation.toFixed(1)}mm net accumulation.`,
    );
  }
  // Moderate to heavy - should shovel
  else {
    shouldShovel = true;

    // Calculate optimal time (after snow stops, before compaction)
    if (snowStopTime) {
      // Adjust shoveling window based on wind
      const adjustedWindow = adjustShovelWindowForWind(
        OPTIMAL_SHOVEL_WINDOW_HOURS,
        avgWindSpeed,
      );
      optimalTime = new Date(
        snowStopTime.getTime() + adjustedWindow * 60 * 60 * 1000,
      );

      // If freeze is coming, shovel before it
      if (freezeTime && optimalTime > freezeTime) {
        optimalTime = new Date(freezeTime.getTime() - 30 * 60 * 1000); // 30 min before freeze
        urgency = "high";
        reasoning.push(
          `Temperature drops below freezing at ${formatTime(freezeTime)}.`,
        );
      }

      // Ensure optimal time isn't in the past
      if (optimalTime < now) {
        optimalTime = now;
      }

      reasoning.push(
        `Snow expected to stop around ${formatTime(snowStopTime)}.`,
      );

      // Add wind warning if significant
      if (avgWindSpeed >= WIND_THRESHOLDS.moderate) {
        reasoning.push(
          `Wind (${Math.round(
            avgWindSpeed,
          )} km/h) speeds up compaction - shovel sooner.`,
        );
      }
    } else {
      optimalTime = now;
    }

    // Set urgency based on accumulation
    if (netAccumulation >= SNOW_THRESHOLDS.heavy) {
      urgency = urgency === "high" ? "urgent" : "high";
      message = `Heavy snow expected - shovel at ${formatTime(optimalTime)}`;
    } else if (netAccumulation >= SNOW_THRESHOLDS.moderate) {
      urgency = urgency === "high" ? "high" : "moderate";
      message = `Moderate snow expected - shovel at ${formatTime(optimalTime)}`;
    } else {
      urgency = urgency === "high" ? "moderate" : "low";
      message = `Light-moderate snow - best to shovel at ${formatTime(
        optimalTime,
      )}`;
    }

    reasoning.push(`Expected accumulation: ${netAccumulation.toFixed(1)}mm.`);
  }

  // Calculate manpower estimate
  const estimatedMinutes = shouldShovel
    ? calculateManpower(areaSquareMeters, netAccumulation)
    : undefined;

  if (estimatedMinutes) {
    reasoning.push(
      `Estimated clearing time: ~${estimatedMinutes} minutes for ${areaSquareMeters}m².`,
    );
  }

  // Get salt advice - factor in current rain and forecast
  const rainExpected = totalRain > 2; // Significant rain expected
  const saltRec = getSaltRecommendation(
    weather.current.temperature,
    minTemp,
    totalSnowfall > SNOW_THRESHOLDS.negligible,
    weather.current.rain,
    rainExpected,
  );

  // Calculate salt amount (approx 20g per square meter)
  const saltAmountKg = areaSquareMeters * 0.02;
  const saltAmountStr =
    saltAmountKg >= 1
      ? `~${saltAmountKg.toFixed(1)} kg`
      : `~${(saltAmountKg * 1000).toFixed(0)} g`;

  let timingMessage = "";
  if (saltRec.shouldApply) {
    if (saltRec.waitForRain) {
      timingMessage = "Wait for rain to stop, then apply.";
    } else if (optimalTime && optimalTime > now) {
      timingMessage = `Apply before ${formatTime(optimalTime)}`;
    } else {
      timingMessage = "Apply now.";
    }
  }

  const salt: SaltAdvice = {
    shouldApply: saltRec.shouldApply,
    reason: saltRec.reason,
    timing: saltRec.shouldApply ? optimalTime : undefined,
    amount: saltRec.shouldApply ? saltAmountStr : undefined,
    timingMessage: saltRec.shouldApply ? timingMessage : undefined,
  };

  // Add salt timing note if waiting for rain
  if (saltRec.waitForRain) {
    reasoning.push("Salt timing: wait for rain to stop before applying.");
  }

  return {
    shouldShovel,
    urgency,
    optimalTime,
    message,
    reasoning,
    estimatedMinutes,
    salt,
    totalAccumulation: netAccumulation,
  };
}

/** Format time for display */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
