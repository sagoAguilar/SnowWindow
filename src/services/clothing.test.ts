import { describe, expect, it } from 'vitest';
import { generateClothingSuggestion } from './clothing';
import type { WeatherData } from '../types';

function makeWeather(overrides: Partial<WeatherData['current']> = {}): WeatherData {
  return {
    location: { latitude: 44.72, longitude: -63.68, name: 'Test' },
    current: {
      temperature: 0,
      snowfall: 0,
      rain: 0,
      cloudCover: 50,
      windSpeed: 10,
      weatherCode: 0,
      isDay: true,
      ...overrides,
    },
    hourly: [],
    fetchedAt: new Date(),
  };
}

describe('generateClothingSuggestion — general', () => {
  it('should suggest heavy gear for extreme cold', () => {
    const weather = makeWeather({ temperature: -20, windSpeed: 30 });
    const result = generateClothingSuggestion(weather);

    expect(result.summary).toContain('Extreme cold');
    expect(result.items.find(i => i.zone === 'torso')?.label).toContain('Heavy winter coat');
    expect(result.items.find(i => i.zone === 'hands')?.label).toContain('mittens');
    expect(result.items.find(i => i.zone === 'head')?.label).toContain('balaclava');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should suggest moderate winter gear for moderately cold conditions', () => {
    const weather = makeWeather({ temperature: -8, windSpeed: 15 });
    const result = generateClothingSuggestion(weather);

    expect(result.summary).toContain('Very cold');
    expect(result.items.find(i => i.zone === 'torso')?.label).toContain('Insulated winter jacket');
    expect(result.items.find(i => i.zone === 'hands')?.label).toContain('Winter gloves');
  });

  it('should suggest lighter layers near freezing', () => {
    const weather = makeWeather({ temperature: 2, windSpeed: 5 });
    const result = generateClothingSuggestion(weather);

    expect(result.summary).toContain('Cold');
    expect(result.items.find(i => i.zone === 'torso')?.label).toContain('Winter jacket');
    expect(result.items.find(i => i.zone === 'hands')?.label).toContain('Light gloves');
  });

  it('should suggest light jacket for mild conditions', () => {
    const weather = makeWeather({ temperature: 8, windSpeed: 5 });
    const result = generateClothingSuggestion(weather);

    expect(result.summary).toContain('Mild');
    expect(result.items.find(i => i.zone === 'torso')?.label).toContain('Light jacket');
    expect(result.items.find(i => i.zone === 'hands')).toBeUndefined();
    expect(result.items.find(i => i.zone === 'head')).toBeUndefined();
  });

  it('should add waterproof note when snowing', () => {
    const weather = makeWeather({ temperature: -3, windSpeed: 10, snowfall: 5 });
    const result = generateClothingSuggestion(weather);

    const torso = result.items.find(i => i.zone === 'torso');
    expect(torso?.label).toContain('waterproof');
    expect(result.items.find(i => i.zone === 'feet')?.label).toContain('Waterproof');
  });

  it('should warn about wind chill difference', () => {
    const weather = makeWeather({ temperature: -5, windSpeed: 40 });
    const result = generateClothingSuggestion(weather);

    expect(result.warnings.some(w => w.includes('Wind chill'))).toBe(true);
    expect(result.feelsLike).toBeLessThan(-5);
  });

  it('should warn about blizzard conditions with heavy wind and snow', () => {
    const weather = makeWeather({ temperature: -10, windSpeed: 50, snowfall: 10 });
    const result = generateClothingSuggestion(weather);

    expect(result.warnings.some(w => w.includes('Blizzard') || w.includes('goggles'))).toBe(true);
  });

  it('should suggest face protection in windy conditions', () => {
    const weather = makeWeather({ temperature: -2, windSpeed: 30 });
    const result = generateClothingSuggestion(weather);

    expect(result.items.find(i => i.zone === 'face')?.label).toContain('Scarf');
  });

  it('should suggest face mask in very windy conditions', () => {
    const weather = makeWeather({ temperature: -5, windSpeed: 45 });
    const result = generateClothingSuggestion(weather);

    expect(result.items.find(i => i.zone === 'face')?.label).toContain('Face mask');
  });

  it('should include feelsLike as a rounded number', () => {
    const weather = makeWeather({ temperature: -10, windSpeed: 20 });
    const result = generateClothingSuggestion(weather);

    expect(Number.isInteger(result.feelsLike)).toBe(true);
    expect(result.feelsLike).toBeLessThanOrEqual(-10);
  });

  it('should suggest water-resistant pants when snowing near freezing', () => {
    const weather = makeWeather({ temperature: 2, windSpeed: 5, snowfall: 3 });
    const result = generateClothingSuggestion(weather);

    expect(result.items.find(i => i.zone === 'legs')?.label).toContain('Water-resistant');
  });
});

describe('generateClothingSuggestion — shoveling mode', () => {
  it('should suggest lighter torso layers than general at same temperature', () => {
    // At -5°C / 10km/h: feelsLike ~= -9°C (between -15 and -5 → "Insulated winter jacket")
    // Shoveling coreFeelsLike ~= -1°C (between -5 and 5 → "Light fleece")
    const weather = makeWeather({ temperature: -5, windSpeed: 10 });
    const general = generateClothingSuggestion(weather);
    const shoveling = generateClothingSuggestion(weather, true);

    const generalTorso = general.items.find(i => i.zone === 'torso')!;
    const shovelingTorso = shoveling.items.find(i => i.zone === 'torso')!;

    expect(generalTorso.label).toContain('Insulated winter jacket');
    expect(shovelingTorso.label).toContain('Light fleece');
  });

  it('should keep same extremity protection (hands/feet) as general', () => {
    const weather = makeWeather({ temperature: -5, windSpeed: 10 });
    const general = generateClothingSuggestion(weather);
    const shoveling = generateClothingSuggestion(weather, true);

    // Feet should be identical — extremities don't benefit from core heat
    const generalFeet = general.items.find(i => i.zone === 'feet')!;
    const shovelingFeet = shoveling.items.find(i => i.zone === 'feet')!;
    expect(shovelingFeet.label).toBe(generalFeet.label);
  });

  it('should suggest work gloves instead of mittens for shoveling', () => {
    const weather = makeWeather({ temperature: -20, windSpeed: 30 });
    const general = generateClothingSuggestion(weather);
    const shoveling = generateClothingSuggestion(weather, true);

    expect(general.items.find(i => i.zone === 'hands')?.label).toContain('mittens');
    expect(shoveling.items.find(i => i.zone === 'hands')?.label).toContain('work gloves');
  });

  it('should warn about overdressing when activity will generate heat', () => {
    // At -5°C with 10 km/h wind: feelsLike ~= -5, coreFeelsLike ~= +3 (> 0)
    const weather = makeWeather({ temperature: -3, windSpeed: 10 });
    const shoveling = generateClothingSuggestion(weather, true);

    expect(shoveling.warnings.some(w => w.includes('overdressing') || w.includes('warm up quickly'))).toBe(true);
  });

  it('should have shoveling-specific summary', () => {
    const weather = makeWeather({ temperature: -3, windSpeed: 10 });
    const shoveling = generateClothingSuggestion(weather, true);

    expect(shoveling.summary).toContain('shoveling');
  });

  it('should still suggest full gear for extreme cold even when shoveling', () => {
    const weather = makeWeather({ temperature: -30, windSpeed: 40 });
    const shoveling = generateClothingSuggestion(weather, true);

    // Even with +8 offset, coreFeelsLike is still very cold
    expect(shoveling.items.find(i => i.zone === 'torso')?.label).toContain('Insulated jacket');
    expect(shoveling.items.find(i => i.zone === 'head')).toBeDefined();
    expect(shoveling.items.find(i => i.zone === 'face')?.label).toContain('Face mask');
    expect(shoveling.warnings.some(w => w.includes('frostbite') || w.includes('breaks'))).toBe(true);
  });

  it('should suggest light breathable layer for mild shoveling conditions', () => {
    const weather = makeWeather({ temperature: 3, windSpeed: 5 });
    const shoveling = generateClothingSuggestion(weather, true);

    // coreFeelsLike = 3 + 8 = 11, so "mild shoveling"
    expect(shoveling.summary).toContain('Mild shoveling');
    expect(shoveling.items.find(i => i.zone === 'torso')?.label).toContain('breathable');
  });

  it('should still add waterproof outer when snowing during shoveling', () => {
    const weather = makeWeather({ temperature: -5, windSpeed: 15, snowfall: 5 });
    const shoveling = generateClothingSuggestion(weather, true);

    const torso = shoveling.items.find(i => i.zone === 'torso');
    expect(torso?.label).toContain('waterproof outer');
  });
});
