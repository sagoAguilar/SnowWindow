/**
 * Snow Science Knowledge Base
 *
 * Constants and calculations for snow accumulation, melting, and clearing.
 * Based on meteorological research and practical snow removal experience.
 */

// ============================================================================
// MELTING FACTORS
// ============================================================================

/**
 * Rain-to-snow melt ratio.
 * 1mm of rain melts approximately 10mm of fresh snow.
 * Source: General meteorological principle
 */
export const RAIN_SNOW_MELT_RATIO = 10;

/**
 * Calculate snow melted by rain.
 * @param rainMm - Rain in millimeters
 * @returns Snow melted in millimeters
 */
export function calculateRainMelting(rainMm: number): number {
  return rainMm * RAIN_SNOW_MELT_RATIO;
}

/**
 * Solar radiation melting rate (mm/hour) at various conditions.
 * Requires temperature above freezing AND sunshine.
 */
export const SOLAR_MELT_RATES = {
  /** Clear sky, temp 1-5°C */
  low: 0.5,
  /** Clear sky, temp 5-10°C */
  moderate: 2,
  /** Clear sky, temp >10°C */
  high: 5,
} as const;

/**
 * Calculate snow melted by solar radiation.
 * @param tempCelsius - Temperature in Celsius
 * @param cloudCover - Cloud cover percentage (0-100)
ee * @param hours - Number of hours of exposure
 * @param isDay - Whether it's daytime
 * @returns Snow melted in millimeters
 */
export function calculateSolarMelting(
  tempCelsius: number,
  cloudCover: number,
  hours: number,
  isDay: boolean
): number {
  // No melting at night or below freezing
  if (!isDay || tempCelsius <= 0) return 0;

  // Reduce melting based on cloud cover (clouds block solar radiation)
  const cloudFactor = 1 - (cloudCover / 100) * 0.8;

  // Determine melt rate based on temperature
  let rate: number;
  if (tempCelsius <= 5) {
    rate = SOLAR_MELT_RATES.low;
  } else if (tempCelsius <= 10) {
    rate = SOLAR_MELT_RATES.moderate;
  } else {
    rate = SOLAR_MELT_RATES.high;
  }

  return rate * cloudFactor * hours;
}

// ============================================================================
// SNOW THRESHOLDS
// ============================================================================

/**
 * Snow accumulation thresholds (in mm).
 * These determine when action is needed.
 */
export const SNOW_THRESHOLDS = {
  /** Below this: no need to shovel */
  negligible: 10,
  /** Light dusting: optional to clear */
  light: 25,
  /** Moderate: should shovel */
  moderate: 75,
  /** Heavy: shovel soon to prevent compaction */
  heavy: 150,
  /** Very heavy: consider shoveling mid-storm */
  veryHeavy: 200,
} as const;

/**
 * Determine if snow amount requires shoveling mid-storm.
 * When accumulation exceeds threshold, better to shovel now than wait.
 */
export function shouldShovelMidStorm(accumulationMm: number): boolean {
  return accumulationMm >= SNOW_THRESHOLDS.veryHeavy;
}

// ============================================================================
// COMPACTION & TIMING
// ============================================================================

/**
 * Temperature at which snow significantly compacts and becomes harder to shovel.
 * Below this, fresh snow stays fluffy. Above then below = ice risk.
 */
export const COMPACTION_FREEZE_TEMP = 0; // Celsius

/**
 * Hours after snowfall stops before compaction becomes significant.
 * Fresh snow is easiest to shovel in this window.
 */
export const OPTIMAL_SHOVEL_WINDOW_HOURS = 2;

/**
 * Calculate urgency based on time until freeze/compaction.
 * @param hoursUntilFreeze - Hours until temperature drops below freezing
 * @returns Urgency multiplier (1 = normal, >1 = more urgent)
 */
export function calculateCompactionUrgency(hoursUntilFreeze: number): number {
  if (hoursUntilFreeze <= 1) return 2; // Very urgent
  if (hoursUntilFreeze <= 3) return 1.5; // Urgent
  return 1; // Normal
}

// ============================================================================
// WIND CHILL & WIND EFFECTS
// ============================================================================

/**
 * Calculate wind chill temperature using the North American formula.
 * Wind chill makes it "feel" colder, accelerating freezing and compaction.
 * Formula valid for temps <= 10°C and wind >= 4.8 km/h
 * Source: Environment Canada / US NWS
 *
 * @param tempCelsius - Actual air temperature in Celsius
 * @param windSpeedKmh - Wind speed in km/h
 * @returns Wind chill temperature in Celsius
 */
export function calculateWindChill(
  tempCelsius: number,
  windSpeedKmh: number
): number {
  // Formula only valid for certain conditions
  if (tempCelsius > 10 || windSpeedKmh < 4.8) {
    return tempCelsius; // Return actual temp if outside valid range
  }

  // North American wind chill formula
  const windChill =
    13.12 +
    0.6215 * tempCelsius -
    11.37 * Math.pow(windSpeedKmh, 0.16) +
    0.3965 * tempCelsius * Math.pow(windSpeedKmh, 0.16);

  return Math.round(windChill * 10) / 10; // Round to 1 decimal
}

/**
 * Wind speed thresholds for snow conditions.
 */
export const WIND_THRESHOLDS = {
  /** Light breeze, minimal effect */
  calm: 10,
  /** Moderate wind, some drifting */
  moderate: 25,
  /** Strong wind, significant drifting */
  strong: 40,
  /** Very strong, blizzard conditions possible */
  severe: 60,
} as const;

/**
 * Calculate how wind accelerates snow freezing/compaction.
 * High winds remove insulating air layer, making snow freeze faster.
 *
 * @param windSpeedKmh - Wind speed in km/h
 * @returns Multiplier for compaction speed (1 = normal, >1 = faster)
 */
export function calculateWindCompactionFactor(windSpeedKmh: number): number {
  if (windSpeedKmh < WIND_THRESHOLDS.calm) return 1;
  if (windSpeedKmh < WIND_THRESHOLDS.moderate) return 1.2;
  if (windSpeedKmh < WIND_THRESHOLDS.strong) return 1.5;
  return 2; // Severe wind doubles compaction speed
}

/**
 * Adjust the optimal shoveling window based on wind.
 * High winds mean you should shovel sooner before compaction.
 *
 * @param baseWindowHours - Normal shoveling window (default 2 hours)
 * @param windSpeedKmh - Current wind speed
 * @returns Adjusted window in hours
 */
export function adjustShovelWindowForWind(
  baseWindowHours: number,
  windSpeedKmh: number
): number {
  const compactionFactor = calculateWindCompactionFactor(windSpeedKmh);
  return Math.max(0.5, baseWindowHours / compactionFactor);
}

// ============================================================================
// MANPOWER ESTIMATION
// ============================================================================

/**
 * Shoveling rates in square meters per minute by snow depth.
 * Based on average adult shoveling speed.
 */
export const SHOVEL_RATES = {
  /** <50mm snow: fast clearing */
  light: 2.5,
  /** 50-100mm: moderate pace */
  moderate: 1.5,
  /** 100-200mm: slow going */
  heavy: 0.8,
  /** >200mm: very slow, may need breaks */
  veryHeavy: 0.4,
} as const;

/**
 * Calculate estimated shoveling time.
 * @param areaSquareMeters - Area to clear in m²
 * @param snowDepthMm - Snow depth in millimeters
 * @returns Estimated minutes to clear
 */
export function calculateManpower(
  areaSquareMeters: number,
  snowDepthMm: number
): number {
  let rate: number;

  if (snowDepthMm < 50) {
    rate = SHOVEL_RATES.light;
  } else if (snowDepthMm < 100) {
    rate = SHOVEL_RATES.moderate;
  } else if (snowDepthMm < 200) {
    rate = SHOVEL_RATES.heavy;
  } else {
    rate = SHOVEL_RATES.veryHeavy;
  }

  return Math.ceil(areaSquareMeters / rate);
}

// ============================================================================
// SALT TIMING
// ============================================================================

/**
 * Salt effectiveness by temperature.
 * Standard rock salt (NaCl) becomes less effective as temperature drops.
 */
export const SALT_EFFECTIVENESS = {
  /** Temp > -5°C: salt works well */
  effective: -5,
  /** -5 to -10°C: reduced effectiveness */
  reduced: -10,
  /** Below -10°C: salt largely ineffective, use sand/alternative */
  ineffective: -15,
} as const;

/**
 * Determine if and when to apply salt.
 * @param currentTemp - Current temperature in Celsius
 * @param forecastMinTemp - Lowest forecasted temperature
 * @param snowExpected - Whether snow is expected
 * @returns Salt recommendation
 */
export function getSaltRecommendation(
  currentTemp: number,
  forecastMinTemp: number,
  snowExpected: boolean
): { shouldApply: boolean; reason: string } {
  // Salt won't work if too cold
  if (forecastMinTemp < SALT_EFFECTIVENESS.ineffective) {
    return {
      shouldApply: false,
      reason: `Too cold for salt (${forecastMinTemp}°C). Use sand instead.`,
    };
  }

  // Preventive salting before freeze
  if (currentTemp > 0 && forecastMinTemp < 0) {
    return {
      shouldApply: true,
      reason: "Apply salt now before freezing temperatures arrive.",
    };
  }

  // Post-shoveling if ice risk
  if (snowExpected && forecastMinTemp < 0) {
    return {
      shouldApply: true,
      reason: "Apply salt after shoveling to prevent ice formation.",
    };
  }

  return {
    shouldApply: false,
    reason: "Salt not currently needed.",
  };
}

// ============================================================================
// NET ACCUMULATION
// ============================================================================

/**
 * Calculate net snow accumulation after melting factors.
 * @param snowfallMm - Total snowfall in mm
 * @param rainMm - Total rain in mm
 * @param solarMeltMm - Snow melted by sun
 * @returns Net snow on ground in mm (minimum 0)
 */
export function calculateNetAccumulation(
  snowfallMm: number,
  rainMm: number,
  solarMeltMm: number
): number {
  const rainMelt = calculateRainMelting(rainMm);
  const net = snowfallMm - rainMelt - solarMeltMm;
  return Math.max(0, net);
}
