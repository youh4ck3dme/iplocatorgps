import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Circle, GoogleMap, Marker, AdvancedMarker, Polyline, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '60vh' };
const DEFAULT_GEOFENCE_RADIUS = 80;

function distanceBetweenMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadius * c;
}

function distanceForPath(points) {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetweenMeters(points[i - 1], points[i]);
  }
  return total;
}

export default function LocationPage() {
  const router = useRouter();
  const token = useMemo(() => {
    if (!router.isReady) {
      return null;
    }

    const routeToken = Array.isArray(router.query.token) ? router.query.token[0] : router.query.token;
    const queryToken = Array.isArray(router.query.t) ? router.query.t[0] : router.query.t;
    return routeToken || queryToken || null;
  }, [router.isReady, router.query.token, router.query.t]);

  const isViewerMode = useMemo(() => {
    if (!router.isReady) {
      return false;
    }

    const view = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
    return view === '1';
  }, [router.isReady, router.query.view]);

  const [consent, setConsent] = useState(false);
  const [location, setLocation] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState('');
  const [trackPoints, setTrackPoints] = useState([]);
  const [distanceMeters, setDistanceMeters] = useState(0);

  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofenceRadius, setGeofenceRadius] = useState(DEFAULT_GEOFENCE_RADIUS);
  const [geofenceAlert, setGeofenceAlert] = useState('');

  const [batteryAware, setBatteryAware] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batteryCharging, setBatteryCharging] = useState(null);

  const [targetLat, setTargetLat] = useState('');
  const [targetLng, setTargetLng] = useState('');
  const [etaMinutes, setEtaMinutes] = useState(null);

  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  const watchIdRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const trackerLink = useMemo(() => {
    if (typeof window === 'undefined' || !token) {
      return '';
    }

    return `${window.location.origin}/${token}`;
  }, [token]);

  const viewerLink = useMemo(() => {
    if (typeof window === 'undefined' || !token) {
      return '';
    }

    return `${window.location.origin}/${token}?view=1`;
  }, [token]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('Tracking stopped');
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let batteryManager;
    let onLevelChange;
    let onChargingChange;

    async function loadBattery() {
      if (!navigator.getBattery) {
        return;
      }

      batteryManager = await navigator.getBattery();
      setBatteryLevel(batteryManager.level);
      setBatteryCharging(batteryManager.charging);

      onLevelChange = () => setBatteryLevel(batteryManager.level);
      onChargingChange = () => setBatteryCharging(batteryManager.charging);

      batteryManager.addEventListener('levelchange', onLevelChange);
      batteryManager.addEventListener('chargingchange', onChargingChange);
    }

    loadBattery();

    return () => {
      if (batteryManager && onLevelChange) {
        batteryManager.removeEventListener('levelchange', onLevelChange);
      }
      if (batteryManager && onChargingChange) {
        batteryManager.removeEventListener('chargingchange', onChargingChange);
      }
    };
  }, []);

  const sendLocation = useCallback(
    async (coords) => {
      if (!token) {
        return;
      }

      const payload = {
        token,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen: `${window.screen.width}x${window.screen.height}`
        }
      };

      await axios.post('/api/location', payload);
    },
    [token]
  );

  const updateEta = useCallback(
    (point, speed) => {
      const lat = Number(targetLat);
      const lng = Number(targetLng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setEtaMinutes(null);
        return;
      }

      if (typeof speed !== 'number' || speed <= 0.5) {
        setEtaMinutes(null);
        return;
      }

      const meters = distanceBetweenMeters(point, { lat, lng });
      setEtaMinutes((meters / speed) / 60);
    },
    [targetLat, targetLng]
  );

  const getWatchOptions = useCallback(() => {
    if (batteryAware && batteryLevel !== null && batteryLevel < 0.2 && batteryCharging === false) {
      return {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 15000
      };
    }

    return {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };
  }, [batteryAware, batteryCharging, batteryLevel]);

  const startTracking = useCallback(() => {
    setError('');
    setGeofenceAlert('');

    if (!token) {
      setError('Missing token in URL.');
      return;
    }

    if (!consent) {
      setError('Please confirm consent first.');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTrackPoints([]);
    setDistanceMeters(0);
    setGeofenceCenter(null);
    setStatus('Requesting precise location...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { coords } = position;
        const point = { lat: coords.latitude, lng: coords.longitude };

        setLocation(point);
        setDeviceInfo({
          accuracy: `${Math.round(coords.accuracy)} m`,
          altitude: coords.altitude,
          heading: coords.heading,
          speed: coords.speed,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        });

        setTrackPoints((prev) => {
          if (prev.length === 0) {
            setGeofenceCenter(point);
            updateEta(point, coords.speed);
            return [point];
          }

          const previous = prev[prev.length - 1];
          const delta = distanceBetweenMeters(previous, point);

          if (delta < 2) {
            updateEta(point, coords.speed);
            return prev;
          }

          setDistanceMeters((current) => current + delta);
          updateEta(point, coords.speed);
          return [...prev, point];
        });

        if (geofenceEnabled && geofenceCenter) {
          const fromCenter = distanceBetweenMeters(geofenceCenter, point);
          if (fromCenter > geofenceRadius) {
            setGeofenceAlert(`Geofence exceeded by ${Math.round(fromCenter - geofenceRadius)} m`);
          } else {
            setGeofenceAlert('');
          }
        }

        setStatus(`Tracking (${Math.round(coords.accuracy)} m)`);

        try {
          await sendLocation(coords);
        } catch {
          setError('Location captured, but server upload failed.');
        }
      },
      (geoError) => {
        setError(geoError.message);
        setStatus('Tracking error');
      },
      getWatchOptions()
    );
  }, [consent, geofenceCenter, geofenceEnabled, geofenceRadius, getWatchOptions, sendLocation, token, updateEta]);

  useEffect(() => {
    if (!token || !isViewerMode) {
      return undefined;
    }

    let active = true;

    const fetchSession = async () => {
      try {
        const response = await axios.get(`/api/session/${token}`);
        if (!active || !response?.data?.session) {
          return;
        }

        const sessionPoints = response.data.session.points || [];
        setTrackPoints(sessionPoints.map((point) => ({ lat: point.lat, lng: point.lng })));

        if (sessionPoints.length > 0) {
          const last = sessionPoints[sessionPoints.length - 1];
          const lastPoint = { lat: last.lat, lng: last.lng };
          setLocation(lastPoint);
          setDistanceMeters(distanceForPath(sessionPoints));
        }

        setStatus('Viewer mode live refresh');
      } catch {
        if (active) {
          setStatus('Viewer waiting for data...');
        }
      }
    };

    fetchSession();
    const intervalId = setInterval(fetchSession, 3000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isViewerMode, token]);

  useEffect(() => {
    if (!isReplaying || trackPoints.length < 2) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setReplayIndex((current) => {
        if (current >= trackPoints.length - 1) {
          setIsReplaying(false);
          return current;
        }
        return current + 1;
      });
    }, 600);

    return () => clearInterval(intervalId);
  }, [isReplaying, trackPoints]);

  const displayPoint = isReplaying && trackPoints[replayIndex] ? trackPoints[replayIndex] : location;

  return (
    <main style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Mobile Location Capture</h1>
      <p>Status: {status}</p>

      <div style={{ marginBottom: 12, background: '#f1f5f9', padding: 10 }}>
        <strong>Live share room</strong>
        <div>Tracker link: {trackerLink || '...'}</div>
        <div>Viewer link: {viewerLink || '...'}</div>
      </div>

      {!isViewerMode ? (
        <>
          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to share
            my location for testing.
          </label>

          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={batteryAware}
              onChange={(e) => setBatteryAware(e.target.checked)}
            />{' '}
            Battery-aware tracking
          </label>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={startTracking}>Start precise tracking</button>
            <button onClick={stopTracking}>Stop</button>
          </div>
        </>
      ) : (
        <p style={{ marginBottom: 16 }}>Viewer mode is active. This screen receives live updates from session API.</p>
      )}

      <div style={{ marginBottom: 12, background: '#fff7ed', padding: 10 }}>
        <strong>Geofence</strong>
        <div>
          <label>
            <input
              type="checkbox"
              checked={geofenceEnabled}
              onChange={(e) => setGeofenceEnabled(e.target.checked)}
            />{' '}
            Enabled
          </label>
        </div>
        <div>
          Radius (m):{' '}
          <input
            type="number"
            min="20"
            max="1000"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(Number(e.target.value) || DEFAULT_GEOFENCE_RADIUS)}
          />
        </div>
        {geofenceAlert ? <div style={{ color: '#b91c1c' }}>{geofenceAlert}</div> : null}
      </div>

      <div style={{ marginBottom: 12, background: '#ecfeff', padding: 10 }}>
        <strong>ETA target</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Target latitude" value={targetLat} onChange={(e) => setTargetLat(e.target.value)} />
          <input placeholder="Target longitude" value={targetLng} onChange={(e) => setTargetLng(e.target.value)} />
        </div>
        <div>ETA: {etaMinutes !== null ? `${etaMinutes.toFixed(1)} min` : 'n/a (needs target + speed)'}</div>
      </div>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      {isLoaded && displayPoint ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={displayPoint}
          zoom={17}
          options={{ mapId: 'DEMO_MAP_ID' }}
        >
          <AdvancedMarker position={displayPoint} />
          {trackPoints.length > 1 ? (
            <Polyline
              path={trackPoints}
              options={{ strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 4 }}
            />
          ) : null}
          {geofenceEnabled && geofenceCenter ? (
            <Circle
              center={geofenceCenter}
              radius={geofenceRadius}
              options={{ fillColor: '#f59e0b', fillOpacity: 0.15, strokeColor: '#f59e0b', strokeWeight: 2 }}
            />
          ) : null}
        </GoogleMap>
      ) : (
        <p>Map will appear after first GPS fix.</p>
      )}

      <div style={{ marginTop: 12, background: '#eef6ff', padding: 10 }}>
        <strong>Experimental movement stats</strong>
        <div>Points captured: {trackPoints.length}</div>
        <div>Distance: {(distanceMeters / 1000).toFixed(3)} km</div>
        <div>
          Battery: {batteryLevel === null ? 'n/a' : `${Math.round(batteryLevel * 100)}%`} /{' '}
          {batteryCharging === null ? 'unknown' : batteryCharging ? 'charging' : 'discharging'}
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#f8fafc', padding: 10 }}>
        <strong>Session replay</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={() => {
              setReplayIndex(0);
              setIsReplaying(true);
            }}
            disabled={trackPoints.length < 2}
          >
            Play replay
          </button>
          <button onClick={() => setIsReplaying(false)}>Pause replay</button>
        </div>
        <div>
          Replay point: {trackPoints.length === 0 ? 0 : Math.min(replayIndex + 1, trackPoints.length)} / {trackPoints.length}
        </div>
      </div>

      {deviceInfo ? (
        <div style={{ marginTop: 16, background: '#f8f8f8', padding: 12 }}>
          <h3>Device and signal info</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(deviceInfo, null, 2)}</pre>
        </div>
      ) : null}
    </main>
  );
}
