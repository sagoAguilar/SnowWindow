import type { Coordinates } from "../types";

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
