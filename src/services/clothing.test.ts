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

describe('generateClothingSuggestion', () => {
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
    // No gloves, hat, etc. needed
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
