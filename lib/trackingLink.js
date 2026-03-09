export function createTrackingLink(origin, token) {
  if (!origin || !token) {
    return '';
  }

  return `${origin}/${token}?token=${token}`;
}
