import { calculateWindChill } from './snowScience';
import type { ClothingItem, ClothingSuggestion, WeatherData } from '../types';

/**
 * Generate clothing suggestions based on current weather conditions.
 * Considers temperature, wind chill, wind speed, and precipitation.
 */
export function generateClothingSuggestion(weather: WeatherData): ClothingSuggestion {
  const { temperature, windSpeed, snowfall, rain } = weather.current;
  const feelsLike = calculateWindChill(temperature, windSpeed);
  const isSnowing = snowfall > 0;
  const isRaining = rain > 0;
  const isWet = isSnowing || isRaining;
  const isWindy = windSpeed >= 25;
  const isVeryWindy = windSpeed >= 40;

  const items: ClothingItem[] = [];
  const warnings: string[] = [];

  // --- Head ---
  if (feelsLike < -15) {
    items.push({ zone: 'head', label: 'Insulated winter hat or balaclava', icon: '🧶' });
  } else if (feelsLike < 5) {
    items.push({ zone: 'head', label: 'Warm beanie or winter hat', icon: '🧢' });
  }

  // --- Face / Neck ---
  if (feelsLike < -15 || isVeryWindy) {
    items.push({ zone: 'face', label: 'Face mask and scarf', icon: '🧣' });
  } else if (feelsLike < 0 || isWindy) {
    items.push({ zone: 'face', label: 'Scarf or neck gaiter', icon: '🧣' });
  }

  // --- Torso ---
  if (feelsLike < -15) {
    items.push({ zone: 'torso', label: 'Heavy winter coat with thermal base layer', icon: '🧥' });
  } else if (feelsLike < -5) {
    items.push({ zone: 'torso', label: 'Insulated winter jacket with fleece layer', icon: '🧥' });
  } else if (feelsLike < 5) {
    items.push({ zone: 'torso', label: 'Winter jacket or layered sweater + shell', icon: '🧥' });
  } else {
    items.push({ zone: 'torso', label: 'Light jacket or windbreaker', icon: '🧥' });
  }

  // Waterproof note
  if (isWet) {
    const outerItem = items.find(i => i.zone === 'torso');
    if (outerItem) {
      outerItem.label += ' (waterproof outer)';
    }
  }

  // --- Hands ---
  if (feelsLike < -15) {
    items.push({ zone: 'hands', label: 'Insulated mittens or ski gloves', icon: '🧤' });
  } else if (feelsLike < 0) {
    items.push({ zone: 'hands', label: 'Winter gloves', icon: '🧤' });
  } else if (feelsLike < 5) {
    items.push({ zone: 'hands', label: 'Light gloves', icon: '🧤' });
  }

  // --- Legs ---
  if (feelsLike < -15) {
    items.push({ zone: 'legs', label: 'Insulated snow pants with thermal base layer', icon: '👖' });
  } else if (feelsLike < -5) {
    items.push({ zone: 'legs', label: 'Snow pants or insulated trousers', icon: '👖' });
  } else if (feelsLike < 5 && isWet) {
    items.push({ zone: 'legs', label: 'Water-resistant pants', icon: '👖' });
  }

  // --- Feet ---
  if (feelsLike < -15) {
    items.push({ zone: 'feet', label: 'Insulated waterproof winter boots with thick socks', icon: '🥾' });
  } else if (feelsLike < 0 || isSnowing) {
    items.push({ zone: 'feet', label: 'Waterproof winter boots', icon: '🥾' });
  } else if (feelsLike < 5 && isWet) {
    items.push({ zone: 'feet', label: 'Water-resistant boots', icon: '🥾' });
  }

  // --- Warnings ---
  if (feelsLike < -25) {
    warnings.push('Extreme cold: exposed skin can get frostbite in minutes. Minimize time outdoors.');
  } else if (feelsLike < -15) {
    warnings.push('Severe cold: cover all exposed skin. Risk of frostbite on exposed areas.');
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

  return {
    summary,
    feelsLike: Math.round(feelsLike),
    items,
    warnings,
  };
}
