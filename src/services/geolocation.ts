import type { Coordinates } from "../types";

/**
 * Reverse geocode coordinates to a human-readable place name.
 * Uses the Nominatim (OpenStreetMap) API.
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&zoom=14`,
      {
        headers: {
          "Accept-Language": "en",
        },
      },
    );

    if (!response.ok) {
      return "";
    }

    const data = await response.json();

    // Build a concise name from address components
    const addr = data.address;
    if (!addr) return data.display_name || "";

    const city =
      addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || "";
    const state = addr.state || addr.region || "";
    const country = addr.country || "";

    if (city && state) return `${city}, ${state}`;
    if (city && country) return `${city}, ${country}`;
    if (state && country) return `${state}, ${country}`;
    return data.display_name || "";
  } catch {
    return "";
  }
}

/**
 * Get user's current location using browser geolocation.
 * Returns a promise that resolves to coordinates or rejects with an error.
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    // Geolocation requires a secure context (HTTPS) in most modern browsers
    if (!window.isSecureContext) {
      reject(
        new Error(
          "Location access requires a secure connection (HTTPS). If testing locally on Android, try using a tunneling service like ngrok or local forwarding.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location access was denied. Please check your browser permissions (address bar icon) or ensure your device's Location is turned on.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            message = "An unknown error occurred getting location.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  });
}
