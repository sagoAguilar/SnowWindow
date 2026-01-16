export interface WeatherScenario {
  id: string;
  name: string;
  description: string;
  params: {
    temperature: number; // Current temp in °C
    tempTrend: "rising" | "falling" | "stable"; // Temperature trend over forecast
    snowfallRate: number; // mm/hour
    rainRate: number; // mm/hour
    cloudCover: number; // 0-100
    windSpeed: number; // km/h
    weatherCode: number; // WMO code
    isDay: boolean;
    durationHours: number; // How long conditions persist
  };
}

export const PRESET_SCENARIOS: WeatherScenario[] = [
  {
    id: "heavy-overnight-snow",
    name: "❄️ Heavy Overnight Snow",
    description: "Heavy snowfall throughout the night (15mm/hr for 6 hours)",
    params: {
      temperature: -8,
      tempTrend: "stable",
      snowfallRate: 15,
      rainRate: 0,
      cloudCover: 95,
      windSpeed: 15,
      weatherCode: 75, // Heavy snow
      isDay: false,
      durationHours: 6,
    },
  },
  {
    id: "light-snow-rain-melt",
    name: "🌨️ Light Snow + Rain Melting",
    description: "Light snow with rain causing melting (2mm snow + 5mm rain)",
    params: {
      temperature: 2,
      tempTrend: "rising",
      snowfallRate: 2,
      rainRate: 5,
      cloudCover: 85,
      windSpeed: 10,
      weatherCode: 73, // Moderate snow
      isDay: true,
      durationHours: 4,
    },
  },
  {
    id: "freezing-rain",
    name: "🧊 Freezing Rain Warning",
    description: "Rain with temperature dropping below freezing",
    params: {
      temperature: 3,
      tempTrend: "falling",
      snowfallRate: 0,
      rainRate: 3,
      cloudCover: 90,
      windSpeed: 20,
      weatherCode: 63, // Moderate rain
      isDay: true,
      durationHours: 6,
    },
  },
  {
    id: "wind-compaction",
    name: "💨 High Wind Compaction",
    description: "Moderate snow with strong winds (60km/h)",
    params: {
      temperature: -5,
      tempTrend: "stable",
      snowfallRate: 8,
      rainRate: 0,
      cloudCover: 80,
      windSpeed: 60,
      weatherCode: 73, // Moderate snow
      isDay: true,
      durationHours: 8,
    },
  },
  {
    id: "solar-melting",
    name: "☀️ Solar Melting",
    description: "Light snow during sunny day causing natural melt",
    params: {
      temperature: 4,
      tempTrend: "rising",
      snowfallRate: 1.5,
      rainRate: 0,
      cloudCover: 20,
      windSpeed: 5,
      weatherCode: 71, // Light snow
      isDay: true,
      durationHours: 6,
    },
  },
  {
    id: "mid-storm-threshold",
    name: "⚠️ Mid-Storm Urgent",
    description: "Very heavy accumulation requiring immediate action",
    params: {
      temperature: -10,
      tempTrend: "falling",
      snowfallRate: 20,
      rainRate: 0,
      cloudCover: 100,
      windSpeed: 40,
      weatherCode: 75, // Heavy snow
      isDay: false,
      durationHours: 4,
    },
  },
  {
    id: "clear-no-action",
    name: "✨ Clear - No Action",
    description: "Clear weather with no snow expected",
    params: {
      temperature: -2,
      tempTrend: "stable",
      snowfallRate: 0,
      rainRate: 0,
      cloudCover: 10,
      windSpeed: 8,
      weatherCode: 0, // Clear
      isDay: true,
      durationHours: 24,
    },
  },
  {
    id: "salt-timing-test",
    name: "🧂 Salt Timing Test",
    description: "Rain followed by freeze (tests salt recommendation)",
    params: {
      temperature: 5,
      tempTrend: "falling",
      snowfallRate: 0,
      rainRate: 4,
      cloudCover: 70,
      windSpeed: 12,
      weatherCode: 61, // Light rain
      isDay: true,
      durationHours: 8,
    },
  },
  {
    id: "thundersnow",
    name: "⛈️ Thundersnow",
    description: "Rare thunderstorm with heavy snow",
    params: {
      temperature: -3,
      tempTrend: "stable",
      snowfallRate: 12,
      rainRate: 0,
      cloudCover: 100,
      windSpeed: 35,
      weatherCode: 95, // Thunderstorm
      isDay: false,
      durationHours: 3,
    },
  },
  {
    id: "fog-light-snow",
    name: "🌫️ Foggy Light Snow",
    description: "Fog with light snow accumulation",
    params: {
      temperature: 0,
      tempTrend: "stable",
      snowfallRate: 3,
      rainRate: 0,
      cloudCover: 95,
      windSpeed: 5,
      weatherCode: 48, // Fog
      isDay: false,
      durationHours: 12,
    },
  },
];
