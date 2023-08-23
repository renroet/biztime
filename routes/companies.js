const express = require("express");
const slugify = require("slugify");
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
        const results = await db.query(`SELECT *, i.id AS inv_id FROM companies LEFT JOIN invoices AS i ON code=i.comp_code RIGHT JOIN company_industries AS c ON c.comp_code=i.comp_code WHERE code =$1 GROUP BY code, c.id, i.id;`, [code])
        if(results.rows.length === 0) throw new ExpressError('No results found', 404)
        let { name, description, ind_code} = results.rows[0]
        let invoices = []
        let industries = []
        if (ind_code) {industries.push(ind_code)}
        for (let row of results.rows) {
            if(invoices.indexOf(row.inv_id) === -1) {
                let { inv_id, amt, paid, add_date, paid_date } = row
                let invoice = {inv_id, amt, paid, add_date, paid_date}
                invoices.push(invoice)
            }
            if(industries.indexOf(row.ind_code) === -1) {
                let { ind_code } = row
                industries.push(ind_code)
            }
        }
        return res.json({ company: {code, name, description, invoices, industries} })
    } catch (e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try {
        let { name, description } = req.body
        let code = slugify(name, {replacement: '', remove: /[^a-zA-Z]/g, lower: true, strict: true})
        if(!name) throw new ExpressError('Company must have unique name', 400)
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