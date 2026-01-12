/** Coordinates for a location */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Location with optional name */
export interface Location extends Coordinates {
  name?: string;
}

/** Hourly weather data point */
export interface HourlyWeather {
  time: Date;
  temperature: number; // Celsius
  snowfall: number; // mm
  rain: number; // mm
  cloudCover: number; // percentage 0-100
  windSpeed: number; // km/h
  isDay: boolean;
}

/** Normalized weather data from any provider */
export interface WeatherData {
  location: Location;
  current: {
    temperature: number;
    snowfall: number;
    rain: number;
    cloudCover: number;
    windSpeed: number;
    isDay: boolean;
  };
  hourly: HourlyWeather[];
  fetchedAt: Date;
}

/** Urgency level for shoveling */
export type UrgencyLevel = "none" | "low" | "moderate" | "high" | "urgent";

/** Salt recommendation */
export interface SaltAdvice {
  shouldApply: boolean;
  timing?: Date;
  reason: string;
}

/** Main shoveling recommendation */
export interface ShovelingRecommendation {
  shouldShovel: boolean;
  urgency: UrgencyLevel;
  optimalTime?: Date;
  message: string;
  reasoning: string[];
  estimatedMinutes?: number; // Time to shovel (based on area)
  salt: SaltAdvice;
  totalAccumulation: number; // mm of snow
}

/** User settings */
export interface UserSettings {
  areaSquareMeters: number; // Driveway/walkway area
  notificationsEnabled: boolean;
}

/** App state */
export interface AppState {
  location: Location | null;
  weather: WeatherData | null;
  recommendation: ShovelingRecommendation | null;
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
}
