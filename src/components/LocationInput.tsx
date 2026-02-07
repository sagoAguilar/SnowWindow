import { useState } from 'react';
import { getCurrentLocation, reverseGeocode } from '../services/geolocation';
import type { Location } from '../types';

interface LocationInputProps {
  onLocationSet: (location: Location) => void;
  currentLocation: Location | null;
  isLoading: boolean;
}

export function LocationInput({ onLocationSet, currentLocation, isLoading }: LocationInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleGetLocation = async () => {
    setError(null);
    setIsGettingLocation(true);

    // Geolocation requires a secure context (HTTPS) in most modern browsers
    // Check handled in service, but good to be aware

    try {
      const coords = await getCurrentLocation();
      const locationName = await reverseGeocode(coords);
      onLocationSet({
        ...coords,
        name: locationName || 'Current Location'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleManualSubmit = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    const coords = { latitude: lat, longitude: lng };
    const locationName = await reverseGeocode(coords);
    onLocationSet({
      ...coords,
      name: locationName || 'Manual Location',
    });
    setError(null);
  };

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    setError(null);
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
          <div className="location-actions">
            <button
              className="btn btn-secondary"
              onClick={handleGetLocation}
              disabled={isLoading || isGettingLocation}
            >
              Update w/ GPS
            </button>
            <button
              className="btn btn-text"
              onClick={() => {
                setIsManualMode(true);
                onLocationSet(null as any); // Clear current to show input form again or just switch mode? 
                // Actually, simpler to just switch to manual mode UI if they want to edit
              }}
            >
              Edit Manually
            </button>
          </div>

        </div>
      ) : (
        <div className="location-forms">
          {!isManualMode ? (
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
              <button className="btn btn-link" onClick={toggleManualMode}>
                Enter coordinates manually
              </button>
            </div>
          ) : (
            <div className="location-manual">
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 40.7128"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. -74.0060"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
              <div className="manual-actions">
                <button className="btn btn-primary" onClick={handleManualSubmit}>
                  Set Location
                </button>
                <button className="btn btn-secondary" onClick={toggleManualMode}>
                  Cancel
                </button>
              </div>
            </div>
          )}
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
