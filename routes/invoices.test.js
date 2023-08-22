process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;
beforeEach(async () => {
  await db.query(`DELETE FROM companies`)
  await db.query(`DELETE FROM invoices`)
  await db.query("SELECT setval('invoices_id_seq', 1, false)");
  const result = await db.query(`INSERT INTO companies VALUES ('test', 'Test', 'test company') RETURNING  code, name, description`);
  testCompany = result.rows[0]
  const result2 = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('test', 100) RETURNING id, amt, comp_code, paid, add_date, paid_date`);
  testInvoice = result2.rows[0]
})



afterAll(async () => {
  await db.end()
})

describe("GET /invoices", () => {
  test("Get a list with one invoice", async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [
        { id: 1, 
        comp_code: 'test',
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null }] })
  })
  test("Get invoice object using invoice id", async () => {
    const res = await request(app).get('/invoices/1')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({invoice: {
        id: 1,
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
        company: {
            code: 'test',
            name: 'Test',
            description: 'test company'
        }
    }})
  })
  test("Respond with 404 if invalid invoice", async () => {
    const res = await request(app).get('/invoice/36')
    expect(res.statusCode).toBe(404)
  })
})

describe("POST /invoices", () => {
    test("Add new invoice to company", async () => {
        const res = await request(app).post('/invoices').send({comp_code: 'test', amt: 300})
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({invoice: {
            id: 2,
            comp_code: 'test',
            amt: 300,
            paid: false,
            add_date: expect.any(String),
            paid_date: null
        }})
    })
    test("Respond with 400 if no amt is entered", async () => {
        const res = await request(app).post('/invoices').send({comp_code: 'test', })
        expect(res.statusCode).toBe(400)
    })
})

describe("PUT /invoices", () => {
    test("Update invoice amt by invoice id", async () => {
        const res = await request(app).put('/invoices/1').send({amt: 75})
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoice: {
            id: 1,
            comp_code: 'test',
            amt: 75,
            paid: false,
            add_date: expect.any(String),
            paid_date: null
        }})
    })
    test("Respond with 404 if id is invalid", async () => {
        const res = await request(app).post('/invoices/3').send({comp_code: 'test', })
        expect(res.statusCode).toBe(404)
    })
})

describe("DELETE /invoices", () => {
    test("Delete invoice by invoice id", async () => {
        const res = await request(app).delete('/invoices/1')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: 'deleted'})
    })
    test("Respond with 404 if id is invalid", async () => {
        const res = await request(app).post('/invoices/2')
        expect(res.statusCode).toBe(404)
    })
})