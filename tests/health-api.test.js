import { describe, expect, it } from 'vitest';
import handler from '../pages/api/health';

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

describe('GET /api/health handler', () => {
  it('returns 200 with ok payload', async () => {
    const req = { method: 'GET' };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.payload.service).toBe('location-tracker');
    expect(typeof res.payload.timestamp).toBe('string');
  });
});
