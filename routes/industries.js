const express = require('express')
const slugify = require('slugify')
const expressError = require('../expressError')
const router = express.Router();
const db = require('../db')


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT industries.code AS icode, industry, id, ind_code, comp_code, companies.code AS cCode, name, description FROM industries LEFT JOIN company_industries AS d ON industries.code=d.ind_code LEFT JOIN companies ON companies.code=d.comp_code ORDER BY ind_code');
        let industries = []
        for(let i = 0; i<results.rows.length; i++) { 
            let { industry } = results.rows[i]
            let created = industries.some(ind => ind.industry === industry);
            if (!created) {
                let ind = {industry: industry,
                    companies: []
                }
                for(let row of results.rows) {
                    if(row.name && row.industry === industry && ind.companies.indexOf(row.name) === -1) {
                ind.companies.push(row.name)
                }
                }
                industries.push(ind)
            }
       } 
            
        return res.json({ industries: industries })  
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        let { industry } = req.body
        let code = slugify(industry, {replacement: '', remove: /[^a-zA-Z]/g, lower: true, strict: true})
        code = industry.slice(0,4);
        console.log(code);
        if(!industry) throw new ExpressError('Industry must have unique industry name', 400)
        const results = await db.query(`INSERT INTO industries VALUES ($1, $2) RETURNING code, industry`, [code, industry])
        return res.status(201).json({ industry: results.rows[0]})
    } catch (e) {
        return next(e);
    }
})

router.post('/:comp_code', async (req, res, next) => {
    try {
        let { comp_code } = req.params
        let { ind_code } = req.body
        const results = await db.query(`INSERT INTO company_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING id, comp_code, ind_code`, [comp_code, ind_code]);
        return res.json({status: 'relationship added'})
    } catch (e) {
        return next(e);
    }
})


module.exports = router;