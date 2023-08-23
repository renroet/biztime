const express = require('express')
const expressError = require('../expressError')
const router = express.Router();
const db = require('../db')


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM invoices');
        return res.json({ invoices: results.rows })
    } catch (e) {
        return next(e);
    }
})


router.get('/:id', async (req, res, next) => {
    try {
        let { id } = req.params
        const results = await db.query(`SELECT * FROM invoices JOIN companies on comp_code = code WHERE id = $1`, [id]);
        if ( results.rows.length === 0 ) throw new expressError('No results found', 404)
        let  {code, name, description, amt, paid, add_date, paid_date }  = results.rows[0]
        let ID = results.rows[0].id
        return res.json({ invoice: {id: ID, amt, paid, add_date, paid_date, company: {code, name, description}}});
    } catch (e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try { 
        let { comp_code, amt } = req.body
        if( !comp_code || !amt ) throw new expressError('Invoices must have both company code and amount due', 400);
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        if(results.rows.length === 0) throw new expressError('No company found', 404);
        return res.status(201).json({ invoice: results.rows[0] })
    } catch (e) {
        return next(e);
    }
})


router.put('/:id', async (req, res, next) => {
    try {
        let { id } = req.params
        let { amt, paid } = req.body
        if (paid) {
            const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=CURRENT_TIMESTAMP WHERE id=$3 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, id]);
            if( results.rows.length === 0 ) throw new expressError('No results found', 404);
            return res.json({ invoice: results.rows[0] })
        }
        else {
            const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=null WHERE id=$3 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, id]);
            if( results.rows.length === 0 ) throw new expressError('No results found', 404);
            return res.json({ invoice: results.rows[0] })
        }
    } catch (e) {
        return next(e);
    }
})


router.delete('/:id', async (req, res, next) => {
    try {
        let { id } = req.params
        const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [id])
        if( results.rows.length === 0 ) throw new expressError('No results found', 404);
        return res.json({ status: "deleted" })
    } catch (e) {
        return next(e);
    }
})

module.exports = router;