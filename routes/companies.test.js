process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
  await db.query(`DELETE FROM companies`) 
  const result = await db.query(`INSERT INTO companies VALUES ('test', 'Test', 'test company') RETURNING  code, name, description`);
  testCompany = result.rows[0]
})



afterAll(async () => {
  await db.end()
})

describe("GET /companies", () => {
  test("Get a list with one company", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [{
        code: 'test',
        name: 'Test',
        description: 'test company'
    }] })
  })
  test("Get a company object by company code", async () => {
    const res = await request(app).get('/companies/test')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({company: {
        code: 'test',
        name: 'Test',
        description: 'test company',
        invoices: []
    }} )
  })  
})

describe("POST /companies", () => {
    test("Create new company, add to db", async () => {
        const res = await request(app).post('/companies').send({code: 'addtest', name: 'addTest'})
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({company: {
            code: 'addtest',
            name: 'addTest',
            description: null
        }})
    })
    test("Respond with 500 code if attempt to create company with duplicate company code", async () => {
        const res = await request(app).post('/companies').send({code: 'test', name: 'Test2'})
        expect(res.statusCode).toBe(500)
    })
    test("Respond with 400 code if attempt to create company with with missing code", async () => {
        const res = await request(app).post('/companies').send({ name: 'Test2'})
        expect(res.statusCode).toBe(400)
    })
})

describe("PUT /companies", () => {
    test("Update company description", async () => {
        const res = await request(app).put('/companies/test').send({code: 'test', name: 'Test', description: 'for all your testing needs'})
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: {
            code: 'test',
            name: 'Test',
            description: 'for all your testing needs',
        }})
    })
    test("Responds with 404 if attempt to update company with invalide company code", async () => {
        const res = await request(app).put('/companies/toost').send({code: 'test', name: 'Test', description: 'for all your testing needs'})
        expect(res.statusCode).toBe(404)
    })
})

describe("DELETE /companies", () => {
    test("Delete company by company code", async () => {
        const res = await request(app).delete('/companies/test')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({message: 'Test deleted'})
    })
    test("Responds with 404 if attempt to delete company with invalide company code", async () => {
        const res = await request(app).delete('/companies/toost')
        expect(res.statusCode).toBe(404)
    })
})




