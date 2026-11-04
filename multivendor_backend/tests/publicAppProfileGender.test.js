const express = require('express');
const request = require('supertest');

jest.mock('../public_app/lib/db', () => ({ one: jest.fn() }));

const db = require('../public_app/lib/db');
const auth = require('../public_app/middleware/auth');
const controller = require('../public_app/controllers/publicCtrl');
const app = express();
app.get('/me', auth.required, controller.me);

describe('customer profile gender', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns saved gender on a later authenticated profile request', async () => {
        db.one.mockResolvedValue({
            id: 12,
            tenant_id: 7,
            customer_name: 'Test customer',
            mobile_number: '9999999999',
            email: '',
            gender: 'Female',
            active_status: 1,
        });

        const token = auth.sign({ customerId: 12, tenantId: 7 });
        const response = await request(app).get('/me').set('Authorization', `Bearer ${token}`).expect(200);

        expect(db.one).toHaveBeenCalledWith(expect.stringContaining('email, gender, active_status'), [12, 7]);
        expect(response.body.data.gender).toBe('Female');
    });
});
