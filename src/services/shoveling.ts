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
  lastShoveledAt?: Date, // When user last shoveled (to calculate accumulation since then)
  snowplowPileHeight?: number, // Manual snowplow pile height in mm
  carDepartureTime?: string, // Morning departure time (HH:MM format)
): ShovelingRecommendation {
  const now = new Date();
  const reasoning: string[] = [];

  // Determine start time for accumulation calculation
  // If user shoveled recently (within past 24h), start from then
  // Otherwise, use past 24 hours to capture overnight accumulation
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const accumulationStartTime =
    lastShoveledAt && lastShoveledAt > past24h
      ? lastShoveledAt
      : past24h;

  // Get hours from accumulation start until now (past accumulation)
  const pastHours = weather.hourly.filter((h) => {
    return h.time >= accumulationStartTime && h.time <= now;
  });

  // Get next 24 hours of forecast (future accumulation)
  const next24Hours = weather.hourly.filter((h) => {
    const hoursDiff = (h.time.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 0 && hoursDiff <= 24;
  });

  // Calculate past accumulation (already happened)
  let pastSnowfall = 0;
  let pastRain = 0;
  let pastSolarMelt = 0;

  for (const hour of pastHours) {
    pastSnowfall += hour.snowfall;
    pastRain += hour.rain;

    // Calculate solar melting for past hours
    if (hour.isDay && hour.temperature > 0) {
      pastSolarMelt += calculateSolarMelting(
        hour.temperature,
        hour.cloudCover,
        1, // 1 hour
        hour.isDay,
      );
    }
  }

  // Calculate future accumulation (forecast)
  let futureSnowfall = 0;
  let futureRain = 0;
  let futureSolarMelt = 0;
  let snowStopTime: Date | null = null;
  let lastSnowHour: Date | null = null;
  let snowStartTime: Date | null = null;

  for (const hour of next24Hours) {
    futureSnowfall += hour.snowfall;
    futureRain += hour.rain;

    // Track when snow starts (first hour with snowfall in forecast)
    if (hour.snowfall > 0 && snowStartTime === null) {
      snowStartTime = hour.time;
    }

    // Track when snow stops
    if (hour.snowfall > 0) {
      lastSnowHour = hour.time;
    }

    // Calculate solar melting for each hour
    if (hour.isDay && hour.temperature > 0) {
      futureSolarMelt += calculateSolarMelting(
        hour.temperature,
        hour.cloudCover,
        1, // 1 hour
        hour.isDay,
      );
    }
  }

  // Total snowfall and melting factors
  const totalSnowfall = pastSnowfall + futureSnowfall;
  const totalRain = pastRain + futureRain;
  const totalSolarMelt = pastSolarMelt + futureSolarMelt;

  // Snow stops at the hour after last snowfall
  if (lastSnowHour) {
    snowStopTime = new Date(lastSnowHour.getTime() + 60 * 60 * 1000);
  }

  // Calculate net accumulation (total = past + future, accounting for melting)
  const netAccumulation = calculateNetAccumulation(
    totalSnowfall,
    totalRain,
    totalSolarMelt,
  );

  // Detect slush conditions: rain after snow
  let slushWarning = false;
  let hasSnowThenRain = false;
  for (let i = 0; i < next24Hours.length - 1; i++) {
    const current = next24Hours[i];
    const next = next24Hours[i + 1];
    // If we have snow in one hour, and rain in the next (or vice versa in short period)
    if (current.snowfall > 0 && next.rain > 1) {
      hasSnowThenRain = true;
      break;
    }
  }
  // Also check if we had past snow and future rain is coming
  if (pastSnowfall > 5 && futureRain > 2) {
    hasSnowThenRain = true;
  }
  // Slush warning if we have significant snow+rain combination
  if (hasSnowThenRain && totalSnowfall > 5) {
    slushWarning = true;
  }

  // Check for snowplow pile override
  const snowplowPileDetected = snowplowPileHeight !== undefined && snowplowPileHeight > 0;

  // Check overnight accumulation for morning car departure
  let blocksDriveway = false;
  if (carDepartureTime) {
    // Parse departure time
    const [depHour, depMin] = carDepartureTime.split(':').map(Number);
    const departureToday = new Date(now);
    departureToday.setHours(depHour, depMin, 0, 0);

    // If departure time is in the past today, assume it's for tomorrow
    if (departureToday < now) {
      departureToday.setDate(departureToday.getDate() + 1);
    }

    // Check overnight accumulation (from 6 PM yesterday to departure time)
    const overnightStart = new Date(now);
    overnightStart.setHours(18, 0, 0, 0);
    if (overnightStart > now) {
      overnightStart.setDate(overnightStart.getDate() - 1);
    }

    const overnightHours = weather.hourly.filter(h =>
      h.time >= overnightStart && h.time <= departureToday
    );

    let overnightSnow = 0;
    for (const hour of overnightHours) {
      // Count both past and future overnight snow
      overnightSnow += hour.snowfall;
    }

    // If overnight snow exceeds 5mm (lower threshold for driveway access), flag it
    if (overnightSnow >= 5) {
      blocksDriveway = true;
    }
  }

  // Add context about past vs future accumulation if we have past data
  if (pastSnowfall > 0) {
    const pastNet = calculateNetAccumulation(pastSnowfall, pastRain, pastSolarMelt);
    const futureNet = calculateNetAccumulation(futureSnowfall, futureRain, futureSolarMelt);

    if (lastShoveledAt && lastShoveledAt > past24h) {
      reasoning.push(
        `${pastNet.toFixed(1)}mm accumulated since last shoveled, ${futureNet.toFixed(1)}mm expected.`,
      );
    } else {
      reasoning.push(
        `${pastNet.toFixed(1)}mm accumulated in past 24h, ${futureNet.toFixed(1)}mm expected.`,
      );
    }
  }

  // Find when temperature will drop below freezing (compaction risk)
  // Only relevant if currently above freezing - we're looking for when it WILL drop
  const currentlyBelowFreezing = weather.current.temperature < COMPACTION_FREEZE_TEMP;
  const freezeTime = currentlyBelowFreezing
    ? undefined // Already frozen, no need to rush before "freeze"
    : next24Hours.find(
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
    // Check for override conditions
    if (snowplowPileDetected) {
      urgency = "moderate";
      shouldShovel = true;
      optimalTime = now;
      message = "Snowplow pile needs clearing.";
      reasoning.push(
        `Snowplow left a ${snowplowPileHeight}mm pile that needs removal.`,
      );
    } else if (blocksDriveway) {
      urgency = "moderate";
      shouldShovel = true;
      optimalTime = now;
      message = "Clear driveway for morning departure.";
      reasoning.push(
        `Overnight accumulation blocks car access for ${carDepartureTime} departure.`,
      );
    } else if (slushWarning) {
      urgency = "low";
      shouldShovel = true;
      optimalTime = now;
      message = "Slush cleanup recommended.";
      reasoning.push(
        "Rain after snow creates slush that needs clearing.",
      );
    } else {
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
  }
  // Light snow - optional
  else if (netAccumulation < SNOW_THRESHOLDS.light) {
    // Check for override conditions
    if (snowplowPileDetected) {
      urgency = "moderate";
      shouldShovel = true;
      optimalTime = now;
      message = "Snowplow pile needs clearing.";
      reasoning.push(
        `Snowplow left a ${snowplowPileHeight}mm pile that needs removal.`,
      );
    } else if (blocksDriveway) {
      urgency = "moderate";
      shouldShovel = true;
      optimalTime = now;
      message = "Clear driveway for morning departure.";
      reasoning.push(
        `Overnight accumulation blocks car access for ${carDepartureTime} departure.`,
      );
    } else if (slushWarning) {
      urgency = "low";
      shouldShovel = true;
      optimalTime = now;
      message = "Slush cleanup recommended.";
      reasoning.push(
        "Rain after snow creates slush that needs clearing.",
      );
    } else {
      urgency = "low";
      shouldShovel = false;
      message = "Light dusting expected - shoveling optional.";
      reasoning.push(
        `Expected: ${netAccumulation.toFixed(1)}mm net accumulation.`,
      );
    }
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
      // But if still snowing, wait until snow stops rather than saying "now"
      if (optimalTime < now) {
        if (weather.current.snowfall > 0 && snowStopTime && snowStopTime > now) {
          // Still snowing - recommend shoveling after it stops
          optimalTime = snowStopTime;
        } else {
          optimalTime = now;
        }
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

  // Determine if it's currently snowing
  const isCurrentlySnowing = weather.current.snowfall > 0;

  return {
    shouldShovel,
    urgency,
    optimalTime,
    message,
    reasoning,
    estimatedMinutes,
    salt,
    totalAccumulation: netAccumulation,
    slushWarning,
    blocksDriveway,
    snowplowPileDetected,
    isCurrentlySnowing,
    snowStartTime: snowStartTime ?? undefined,
    snowStopTime: snowStopTime ?? undefined,
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
