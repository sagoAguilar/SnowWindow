import { calculateWindChill } from './snowScience';
import type { ClothingItem, ClothingSuggestion, WeatherData } from '../types';

/**
 * Body heat offset when shoveling (°C).
 * Physical activity generates significant warmth for the core/torso,
 * but extremities (hands, feet) still lose heat and need full protection.
 */
const SHOVELING_CORE_HEAT_OFFSET = 8;

/**
 * Generate clothing suggestions based on current weather conditions.
 * Considers temperature, wind chill, wind speed, and precipitation.
 *
 * @param weather - Current weather data
 * @param forShoveling - If true, adjusts for physical activity (lighter core layers, same extremity protection)
 */
export function generateClothingSuggestion(
  weather: WeatherData,
  forShoveling = false
): ClothingSuggestion {
  const { temperature, windSpeed, snowfall, rain } = weather.current;
  const feelsLike = calculateWindChill(temperature, windSpeed);
  const isSnowing = snowfall > 0;
  const isRaining = rain > 0;
  const isWet = isSnowing || isRaining;
  const isWindy = windSpeed >= 25;
  const isVeryWindy = windSpeed >= 40;

  // Core temp accounts for body heat when shoveling
  const coreFeelsLike = forShoveling ? feelsLike + SHOVELING_CORE_HEAT_OFFSET : feelsLike;

  const items: ClothingItem[] = [];
  const warnings: string[] = [];

  // --- Head ---
  // Shoveling: still need head protection, but use core offset (head warms up with activity)
  // Wind: strong wind strips heat from head/ears — suggest hat even in milder temps
  if (coreFeelsLike < -15) {
    items.push({ zone: 'head', label: 'Insulated winter hat or balaclava', icon: '🧶' });
  } else if (coreFeelsLike < 5 || isWindy) {
    items.push({ zone: 'head', label: isVeryWindy
      ? 'Snug-fitting beanie that covers ears'
      : 'Warm beanie or winter hat', icon: '🧢' });
  }

  // --- Face / Neck ---
  if (feelsLike < -15 || isVeryWindy) {
    items.push({ zone: 'face', label: 'Face mask and scarf', icon: '🧣' });
  } else if (feelsLike < 0 || isWindy) {
    items.push({ zone: 'face', label: 'Scarf or neck gaiter', icon: '🧣' });
  }

  // --- Torso ---
  // Shoveling: use core offset — activity generates heat, so lighter layers are fine
  if (coreFeelsLike < -15) {
    items.push({ zone: 'torso', label: forShoveling
      ? 'Insulated jacket with moisture-wicking base layer'
      : 'Heavy winter coat with thermal base layer', icon: '🧥' });
  } else if (coreFeelsLike < -5) {
    items.push({ zone: 'torso', label: forShoveling
      ? 'Fleece or softshell jacket with moisture-wicking layer'
      : 'Insulated winter jacket with fleece layer', icon: '🧥' });
  } else if (coreFeelsLike < 5) {
    items.push({ zone: 'torso', label: forShoveling
      ? 'Light fleece or athletic layer with wind-resistant shell'
      : 'Winter jacket or layered sweater + shell', icon: '🧥' });
  } else {
    items.push({ zone: 'torso', label: forShoveling
      ? 'Light breathable layer or vest'
      : 'Light jacket or windbreaker', icon: '🧥' });
  }

  // Windproof / waterproof modifiers on torso
  const outerItem = items.find(i => i.zone === 'torso');
  if (outerItem) {
    if (isWet && isWindy) {
      outerItem.label += ' (windproof + waterproof outer)';
    } else if (isWet) {
      outerItem.label += ' (waterproof outer)';
    } else if (isWindy) {
      outerItem.label += ' (windproof outer)';
    }
  }

  // --- Hands (always use real feelsLike — extremities don't benefit from core heat) ---
  // Wind accelerates heat loss from fingers — upgrade glove tier when very windy
  if (feelsLike < -15 || (feelsLike < 0 && isVeryWindy)) {
    items.push({ zone: 'hands', label: forShoveling
      ? 'Insulated waterproof work gloves'
      : 'Insulated mittens or ski gloves', icon: '🧤' });
  } else if (feelsLike < 0 || (feelsLike < 5 && isWindy)) {
    items.push({ zone: 'hands', label: forShoveling
      ? 'Waterproof winter work gloves'
      : 'Winter gloves', icon: '🧤' });
  } else if (feelsLike < 5) {
    items.push({ zone: 'hands', label: forShoveling
      ? 'Grip gloves'
      : 'Light gloves', icon: '🧤' });
  }

  // --- Legs ---
  // Shoveling: use core offset for legs too (large muscle groups generate heat)
  // Wind: strong wind cuts through regular pants — suggest wind-resistant even without precipitation
  if (coreFeelsLike < -15) {
    items.push({ zone: 'legs', label: forShoveling
      ? 'Insulated waterproof snow pants'
      : 'Insulated snow pants with thermal base layer', icon: '👖' });
  } else if (coreFeelsLike < -5) {
    items.push({ zone: 'legs', label: forShoveling
      ? 'Water-resistant athletic pants'
      : 'Snow pants or insulated trousers', icon: '👖' });
  } else if (coreFeelsLike < 5 && (isWet || isWindy)) {
    items.push({ zone: 'legs', label: 'Wind-resistant pants', icon: '👖' });
  }

  // --- Feet (always use real feelsLike — feet stay cold regardless of activity) ---
  if (feelsLike < -15) {
    items.push({ zone: 'feet', label: 'Insulated waterproof winter boots with thick socks', icon: '🥾' });
  } else if (feelsLike < 0 || isSnowing) {
    items.push({ zone: 'feet', label: 'Waterproof winter boots', icon: '🥾' });
  } else if (feelsLike < 5 && isWet) {
    items.push({ zone: 'feet', label: 'Water-resistant boots', icon: '🥾' });
  }

  // --- Warnings ---
  if (feelsLike < -25) {
    warnings.push(forShoveling
      ? 'Extreme cold: take frequent breaks indoors to warm up. Risk of frostbite on exposed skin.'
      : 'Extreme cold: exposed skin can get frostbite in minutes. Minimize time outdoors.');
  } else if (feelsLike < -15) {
    warnings.push('Severe cold: cover all exposed skin. Risk of frostbite on exposed areas.');
  }

  if (forShoveling) {
    if (coreFeelsLike > 0 && feelsLike < 0) {
      warnings.push('You\'ll warm up quickly — avoid overdressing to prevent sweating then chilling.');
    }
  }

  if (isVeryWindy && isSnowing) {
    warnings.push('Blizzard-like conditions: wear goggles or eye protection.');
  } else if (isVeryWindy) {
    warnings.push('Strong winds: secure loose garments and protect face from windburn.');
  }

  if (feelsLike < temperature - 5) {
    warnings.push(`Wind chill makes it feel ${Math.round(temperature - feelsLike)}°C colder than the actual temperature.`);
  }

  // --- Summary ---
  let summary: string;
  if (forShoveling) {
    if (coreFeelsLike < -15) {
      summary = 'Extreme cold — insulated layers with moisture-wicking base';
    } else if (coreFeelsLike < -5) {
      summary = 'Cold shoveling — layer for warmth but allow movement';
    } else if (coreFeelsLike < 5) {
      summary = 'Cool shoveling — light layers, you\'ll warm up fast';
    } else {
      summary = 'Mild shoveling — dress light, activity will keep you warm';
    }
  } else {
    if (feelsLike < -15) {
      summary = 'Extreme cold — bundle up with full winter gear';
    } else if (feelsLike < -5) {
      summary = 'Very cold — wear heavy winter clothing';
    } else if (feelsLike < 0) {
      summary = 'Freezing — dress warmly with winter layers';
    } else if (feelsLike < 5) {
      summary = 'Cold — layer up and bring a warm jacket';
    } else {
      summary = 'Mild — a light jacket should be enough';
    }
  }

  return {
    summary,
    feelsLike: Math.round(feelsLike),
    items,
    warnings,
  };
}
