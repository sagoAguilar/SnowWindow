/**
 * Weather service entry point.
 * Change the default adapter here to swap providers.
 */

export type { WeatherAdapter } from "./adapter";
export { OpenMeteoAdapter } from "./openMeteo";

// Default adapter - change this to swap weather providers
import { OpenMeteoAdapter } from "./openMeteo";

export const weatherAdapter = new OpenMeteoAdapter();
