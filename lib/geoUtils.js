export function distanceBetweenMeters(a, b) {
    if (!a || !b || a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) {
        return 0;
    }
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

export function distanceForPath(points) {
    if (!Array.isArray(points) || points.length < 2) {
        return 0;
    }

    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
        total += distanceBetweenMeters(points[i - 1], points[i]);
    }
    return total;
}

export function calculateEtaMinutes(point, target, speed) {
    if (!point || !target || typeof speed !== 'number' || speed <= 0.5) {
        return null;
    }

    const meters = distanceBetweenMeters(point, target);
    return (meters / speed) / 60;
}
