export function createTrackingLink(origin, token) {
  if (!origin || !token) {
    return '';
  }

  return `${origin}/temu/${token}?token=${token}`;
}
