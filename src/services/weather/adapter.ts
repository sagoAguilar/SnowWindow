import type { Coordinates, WeatherData } from "../../types";

/**
 * Weather adapter interface - contract for any weather provider.
 * Implement this to add a new weather API.
 */
export interface WeatherAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;

  /** Fetch weather data for given coordinates */
  fetchWeather(coords: Coordinates): Promise<WeatherData>;
}
