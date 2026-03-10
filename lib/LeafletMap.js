import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center);
        }
    }, [center, map]);
    return null;
}

export default function LeafletMap({ center, zoom, trackPoints, geofenceEnabled, geofenceCenter, geofenceRadius }) {
    return (
        <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '60vh' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={center} />
            {center && <Marker position={center} />}
            {trackPoints.length > 1 && (
                <Polyline
                    positions={trackPoints}
                    pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.9 }}
                />
            )}
            {geofenceEnabled && geofenceCenter && (
                <Circle
                    center={geofenceCenter}
                    radius={geofenceRadius}
                    pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.15, color: '#f59e0b', weight: 2 }}
                />
            )}
        </MapContainer>
    );
}
