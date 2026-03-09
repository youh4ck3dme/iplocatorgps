import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}));

import axios from 'axios';
import handler from '../pages/api/location';
import { clearSessionStore } from '../lib/sqliteStore';

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

describe('POST /api/location handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearSessionStore();
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('rejects non-POST methods', async () => {
    const req = { method: 'GET', body: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.payload).toEqual({ error: 'Method not allowed' });
  });

  it('rejects invalid payload', async () => {
    const req = { method: 'POST', body: { token: 'a', lat: '1', lng: 2 } };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Invalid payload' });
  });

  it('accepts valid payload without telegram config', async () => {
    const req = { method: 'POST', body: { token: 'a', lat: 1, lng: 2, accuracy: 3 } };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.payload.pointsStored).toBe(1);
    expect(typeof res.payload.lastUpdateAt).toBe('string');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends telegram message when env is configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_CHAT_ID = 'chat-id';

    const req = {
      method: 'POST',
      body: { token: 'abc', lat: 48.1, lng: 17.1, accuracy: 10, deviceInfo: { platform: 'Android' } }
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain('https://api.telegram.org/botbot-token/sendMessage');
  });
});
