import { beforeAll, describe, expect, it } from 'vitest';
import { appendSessionPoint, getSessionSnapshot, clearSessionStore } from '../lib/sqliteStore';

describe('SQLite Store Integration', () => {
    beforeAll(async () => {
        process.env.LOCATION_DB_PATH = ':memory:';
        await clearSessionStore();
    });

    describe('appendSessionPoint', () => {
        it('stores a single point and returns aggregate info', async () => {
            const token = 'test-token-1';
            const point = {
                lat: 50,
                lng: 20,
                accuracy: 5,
                timestamp: new Date().toISOString()
            };

            const result = await appendSessionPoint(token, point);
            expect(result.token).toBe(token);
            expect(result.pointsStored).toBe(1);
            expect(result.createdAt).toBe(point.timestamp);
        });

        it('accrues points for the same token', async () => {
            const token = 'multi-point';
            await appendSessionPoint(token, { lat: 1, lng: 1, timestamp: '2026-01-01T10:00:00Z' });
            const res = await appendSessionPoint(token, { lat: 1, lng: 1, timestamp: '2026-01-01T10:05:00Z' });

            expect(res.pointsStored).toBe(2);
            expect(res.createdAt).toBe('2026-01-01T10:00:00Z');
            expect(res.lastUpdateAt).toBe('2026-01-01T10:05:00Z');
        });

        it('isolates different tokens', async () => {
            const tokenA = 'A';
            const tokenB = 'B';
            await appendSessionPoint(tokenA, { lat: 0, lng: 0, timestamp: 'T1' });
            await appendSessionPoint(tokenB, { lat: 1, lng: 1, timestamp: 'T2' });

            const resA = await appendSessionPoint(tokenA, { lat: 2, lng: 2, timestamp: 'T3' });
            expect(resA.pointsStored).toBe(2);
        });

        it('handles missing optional fields', async () => {
            const res = await appendSessionPoint('minimal', { lat: 0, lng: 0, timestamp: 'T' });
            expect(res.pointsStored).toBe(1);
        });

        it('stores and parses nested deviceInfo', async () => {
            const token = 'device-test';
            const deviceInfo = { mod: 'XYZ', os: 'iOS' };
            await appendSessionPoint(token, { lat: 0, lng: 0, timestamp: 'T', deviceInfo });

            const snapshot = await getSessionSnapshot(token);
            expect(snapshot.points[0].deviceInfo).toEqual(deviceInfo);
        });
    });

    describe('getSessionSnapshot', () => {
        it('returns null for non-existent token', async () => {
            const res = await getSessionSnapshot('non-existent');
            expect(res).toBeNull();
        });

        it('returns all points in chronological order', async () => {
            const token = 'chron-test';
            await appendSessionPoint(token, { lat: 1, lng: 1, timestamp: '2026-01-01T10:00:00Z' });
            await appendSessionPoint(token, { lat: 2, lng: 2, timestamp: '2026-01-01T10:01:00Z' });

            const snap = await getSessionSnapshot(token);
            expect(snap.count).toBe(2);
            expect(snap.points[0].lat).toBe(1);
            expect(snap.points[1].lat).toBe(2);
        });

        it('respects maxPoints limit', async () => {
            const token = 'limit-test';
            for (let i = 0; i < 5; i++) {
                await appendSessionPoint(token, { lat: i, lng: i, timestamp: 'T' + i });
            }
            const snap = await getSessionSnapshot(token, 2);
            expect(snap.points.length).toBe(2);
            // It sorts by descending id and limits, then reverses. So it should be the LAST 2 points.
            expect(snap.points[0].lat).toBe(3);
            expect(snap.points[1].lat).toBe(4);
        });
    });

    describe('clearSessionStore', () => {
        it('removes all points from the database', async () => {
            await appendSessionPoint('x', { lat: 1, lng: 1, timestamp: 'T' });
            await clearSessionStore();
            const res = await getSessionSnapshot('x');
            expect(res).toBeNull();
        });
    });
});
