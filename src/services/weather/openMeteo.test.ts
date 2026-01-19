import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenMeteoAdapter } from "./openMeteo";

describe("OpenMeteoAdapter", () => {
  let adapter: OpenMeteoAdapter;

  beforeEach(() => {
    adapter = new OpenMeteoAdapter();
    vi.resetAllMocks();
  });

  it("fetches weather and converts snowfall from cm to mm", async () => {
    const mockResponse = {
      current: {
        temperature_2m: -5,
        snowfall: 1.5, // 1.5 cm
        rain: 0,
        cloud_cover: 100,
        wind_speed_10m: 10,
        weather_code: 71,
        is_day: 1,
      },
      hourly: {
        time: ["2024-01-01T12:00:00Z"],
        temperature_2m: [-5],
        snowfall: [2.0], // 2.0 cm
        rain: [0],
        cloud_cover: [100],
        wind_speed_10m: [10],
        weather_code: [71],
        is_day: [1],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const weather = await adapter.fetchWeather({
      latitude: 45,
      longitude: -75,
    });

    // Expect 1.5 cm -> 15 mm
    expect(weather.current.snowfall).toBe(15);
    // Expect 2.0 cm -> 20 mm
    expect(weather.hourly[0].snowfall).toBe(20);
  });
});
