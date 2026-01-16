import type { Coordinates, HourlyWeather, WeatherData } from "../../types";
import type { WeatherAdapter } from "./adapter";

export interface MockWeatherParams {
  temperature: number; // °C
  tempTrend: "rising" | "falling" | "stable";
  snowfallRate: number; // mm/hour
  rainRate: number; // mm/hour
  cloudCover: number; // 0-100
  windSpeed: number; // km/h
  weatherCode: number; // WMO code
  isDay: boolean;
  durationHours: number; // How long conditions persist
}

/**
 * Mock weather adapter for testing scenarios.
 * Generates synthetic weather data based on provided parameters.
 */
export class MockWeatherAdapter implements WeatherAdapter {
  readonly name = "mock";

  private params: MockWeatherParams;

  constructor(params: MockWeatherParams) {
    this.params = params;
  }

  /** Update mock parameters */
  setParams(params: MockWeatherParams) {
    this.params = params;
  }

  async fetchWeather(coords: Coordinates): Promise<WeatherData> {
    const now = new Date();
    const hourly: HourlyWeather[] = [];

    // Generate 24 hours of forecast
    for (let i = 0; i < 24; i++) {
      const hourTime = new Date(now.getTime() + i * 60 * 60 * 1000);

      // Determine if this hour is within the active weather duration
      const isActive = i < this.params.durationHours;

      // Calculate temperature based on trend
      let temp = this.params.temperature;
      if (this.params.tempTrend === "rising") {
        temp += (i / 24) * 10; // Rise 10°C over 24 hours
      } else if (this.params.tempTrend === "falling") {
        temp -= (i / 24) * 10; // Fall 10°C over 24 hours
      }

      // Determine day/night (simple: day from 6am-6pm)
      const hour = hourTime.getHours();
      const isDay = hour >= 6 && hour < 18;

      hourly.push({
        time: hourTime,
        temperature: temp,
        snowfall: isActive ? this.params.snowfallRate : 0,
        rain: isActive ? this.params.rainRate : 0,
        cloudCover: isActive
          ? this.params.cloudCover
          : Math.max(0, this.params.cloudCover - 30),
        windSpeed: isActive
          ? this.params.windSpeed
          : this.params.windSpeed * 0.6,
        weatherCode: isActive ? this.params.weatherCode : isDay ? 1 : 0, // Partly cloudy or clear
        isDay,
      });
    }

    return {
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: "🧪 Test Scenario",
      },
      current: {
        temperature: this.params.temperature,
        snowfall: this.params.snowfallRate,
        rain: this.params.rainRate,
        cloudCover: this.params.cloudCover,
        windSpeed: this.params.windSpeed,
        weatherCode: this.params.weatherCode,
        isDay: this.params.isDay,
      },
      hourly,
      fetchedAt: now,
    };
  }
}
