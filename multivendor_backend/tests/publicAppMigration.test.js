const mockInstalledColumns = new Set();

jest.mock('../public_app/lib/db', () => ({
    one: jest.fn(),
    query: jest.fn(),
}));

jest.mock('../config/dbconnect', () => ({ MySQLConPool: { end: jest.fn() } }));

const db = require('../public_app/lib/db');
const { main, additions } = require('../public_app/scripts/migrate');

beforeEach(() => {
    mockInstalledColumns.clear();
    jest.clearAllMocks();
    db.one.mockImplementation(async (_sql, [table, column]) =>
        mockInstalledColumns.has(`${table}.${column}`) ? { COLUMN_NAME: column } : null,
    );
    db.query.mockImplementation(async sql => {
        const alter = /^ALTER TABLE `([^`]+)` ADD COLUMN `([^`]+)`/.exec(sql);
        if (alter) mockInstalledColumns.add(`${alter[1]}.${alter[2]}`);
        return [];
    });
});

describe('customer API schema migration', () => {
    test('adds the address, order snapshot, and tracking columns used by live APIs', async () => {
        await main();

        const alters = db.query.mock.calls.map(([sql]) => sql).filter(sql => sql.startsWith('ALTER TABLE'));
        expect(alters).toEqual(expect.arrayContaining([
            expect.stringContaining('`customer_addresses` ADD COLUMN `location_id`'),
            expect.stringContaining('`orders` ADD COLUMN `address_snapshot`'),
            expect.stringContaining('`orders` ADD COLUMN `bill_snapshot`'),
            expect.stringContaining('`orders` ADD COLUMN `packing_charges`'),
            expect.stringContaining('`orders` ADD COLUMN `accepted_at`'),
            expect.stringContaining('`orders` ADD COLUMN `ready_at`'),
            expect.stringContaining('`orders` ADD COLUMN `scheduled_for`'),
        ]));
        expect(Object.keys(additions.orders)).toContain('tip_amount');
    });

    test('is safe to run repeatedly without issuing duplicate column changes', async () => {
        await main();
        const firstAlterCount = db.query.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE')).length;

        await main();
        const allAlters = db.query.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE'));
        expect(allAlters).toHaveLength(firstAlterCount);
    });
});
