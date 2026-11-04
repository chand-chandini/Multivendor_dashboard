jest.mock('../public_app/lib/db', () => ({ one: jest.fn(), query: jest.fn() }));

const db = require('../public_app/lib/db');
const controller = require('../dashboard_api/controllers/appContentCtrl');

beforeEach(() => jest.clearAllMocks());

describe('tenant app update content management', () => {
    test('saves normalized release notes and platform store links to the draft', async () => {
        const req = {
            admin: { tenant_id: 7 },
            body: {
                latestVersion: '2.4.1',
                releaseNotes: [' Faster checkout ', 'Improved search'],
                androidUrl: 'https://play.example/app',
                iosUrl: 'https://apps.example/app',
            },
        };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await controller.saveAppUpdates(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO app_content'),
            [7, 'app_updates', JSON.stringify({ latestVersion: '2.4.1', releaseNotes: ['Faster checkout', 'Improved search'], androidUrl: 'https://play.example/app', iosUrl: 'https://apps.example/app' })],
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'App update information saved' }));
    });

    test('rejects invalid app-store schemes before saving', async () => {
        const req = {
            admin: { tenant_id: 7 },
            body: { latestVersion: '2.4.1', releaseNotes: ['Update'], androidUrl: 'javascript:alert(1)' },
        };
        const next = jest.fn();

        await controller.saveAppUpdates(req, { json: jest.fn() }, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, code: 'INVALID_APP_UPDATES' }));
        expect(db.query).not.toHaveBeenCalled();
    });

    test('publishes the saved tenant update draft', async () => {
        db.one.mockResolvedValueOnce({ draft_revision: 9 });

        const res = { json: jest.fn() };
        await controller.publishAppUpdates({ admin: { tenant_id: 7 } }, res, jest.fn());

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('published_json=draft_json'), [7, 'app_updates']);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ revision: 9 }));
    });
});
