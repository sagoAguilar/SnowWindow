import { useState } from 'react';
import { getCurrentLocation } from '../services/geolocation';
import type { Location } from '../types';

interface LocationInputProps {
  onLocationSet: (location: Location) => void;
  currentLocation: Location | null;
  isLoading: boolean;
}

export function LocationInput({ onLocationSet, currentLocation, isLoading }: LocationInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetLocation = async () => {
    setError(null);
    setIsGettingLocation(true);

    try {
      const coords = await getCurrentLocation();
      onLocationSet({
        ...coords,
        name: 'Current Location'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="location-input">
      <div className="location-header">
        <span className="location-icon">📍</span>
        <h2>Location</h2>
      </div>

      {currentLocation ? (
        <div className="location-current">
          <p className="location-name">{currentLocation.name || 'Your Location'}</p>
          <p className="location-coords">
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </p>
          <button
            className="btn btn-secondary"
            onClick={handleGetLocation}
            disabled={isLoading || isGettingLocation}
          >
            Update Location
          </button>
        </div>
      ) : (
        <div className="location-empty">
          <p>Set your location to get shoveling recommendations</p>
          <button
            className="btn btn-primary"
            onClick={handleGetLocation}
            disabled={isLoading || isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <span className="spinner"></span>
                Getting Location...
              </>
            ) : (
              '📍 Use My Location'
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}
