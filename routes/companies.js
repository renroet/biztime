const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows })
  } catch (e) {
    return next(e);
  }
})


router.get('/:code', async (req, res, next) => {
    try {
        let { code } = req.params
        const results = await db.query(`SELECT * FROM companies LEFT JOIN invoices ON code=comp_code WHERE code = $1`, [code])
        if(results.rows.length === 0) throw new ExpressError('No results found', 404)
        let { name, description } = results.rows[0]
        let invoices = []
        for (let row of results.rows) {
            if(row.id) {
            let { id, amt, paid, add_date, paid_date } = row
            let invoice = {id, amt, paid, add_date, paid_date}
            invoices.push(invoice)
            }
        }
        return res.json({ company: {code, name, description, invoices} })
    } catch (e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try {
        let { code, name, description } = req.body
        if(!code || !name) throw new ExpressError('Company must have both unique code and name', 400)
        const results = await db.query(`INSERT INTO companies VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({ company: results.rows[0]})
    } catch (e) {
        return next(e);
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        let  pCode  = req.params.code
        let { code, name, description } = req.body
        const results = await db.query(`UPDATE companies SET code=$1, name=$2, description=$3 WHERE code=$4 RETURNING code, name, description`, [code, name, description, pCode])
        if(results.rows.length === 0) throw new ExpressError('No results found', 404)
        return res.json({ company: results.rows[0]})
    } catch (e) {
        return next(e);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        let { code } = req.params
        const results = await db.query(`DELETE from companies  WHERE code=$1 RETURNING name`, [code])
        if(results.rows.length === 0) throw new ExpressError('No results found', 404)
        return res.json({ message: `${results.rows[0].name} deleted`})
    } catch (e) {
        return next(e);
    }
})



module.exports = router;