import type { Coordinates, HourlyWeather, WeatherData } from "../../types";
import type { WeatherAdapter } from "./adapter";

/** Open-Meteo API response shape */
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    snowfall: number;
    rain: number;
    cloud_cover: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    snowfall: number[];
    rain: number[];
    cloud_cover: number[];
    wind_speed_10m: number[];
    is_day: number[];
  };
}

/**
 * Open-Meteo weather adapter.
 * Free API, no key required.
 * https://open-meteo.com/
 */
export class OpenMeteoAdapter implements WeatherAdapter {
  readonly name = "open-meteo";

  private readonly baseUrl = "https://api.open-meteo.com/v1/forecast";

  async fetchWeather(coords: Coordinates): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      current: "temperature_2m,snowfall,rain,cloud_cover,wind_speed_10m,is_day",
      hourly: "temperature_2m,snowfall,rain,cloud_cover,wind_speed_10m,is_day",
      forecast_days: "3",
      timezone: "auto",
    });

    const response = await fetch(`${this.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(
        `Weather API error: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenMeteoResponse = await response.json();

    return this.transform(data, coords);
  }

  /** Transform Open-Meteo response to normalized WeatherData */
  private transform(data: OpenMeteoResponse, coords: Coordinates): WeatherData {
    const hourly: HourlyWeather[] = data.hourly.time.map((time, i) => ({
      time: new Date(time),
      temperature: data.hourly.temperature_2m[i],
      snowfall: data.hourly.snowfall[i],
      rain: data.hourly.rain[i],
      cloudCover: data.hourly.cloud_cover[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      isDay: data.hourly.is_day[i] === 1,
    }));

    return {
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      current: {
        temperature: data.current.temperature_2m,
        snowfall: data.current.snowfall,
        rain: data.current.rain,
        cloudCover: data.current.cloud_cover,
        windSpeed: data.current.wind_speed_10m,
        isDay: data.current.is_day === 1,
      },
      hourly,
      fetchedAt: new Date(),
    };
  }
}
