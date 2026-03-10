export function createTrackingLink(origin, token) {
  if (!origin || !token) {
    return '';
  }
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${base}/temu/${token}?token=${token}`;
}
