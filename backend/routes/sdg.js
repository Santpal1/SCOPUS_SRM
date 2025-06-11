const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// DB Config
const db = mysql.createConnection({
    host: 'scopus.c3i42gq0gaaj.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Ca55jYuwofeCboV7FYiw',
    database: 'scopus'
});

router.get('/sdg-count', (req, res) => {
    const query = 'SELECT sustainable_development_goals FROM paper_insights';

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const counts = {};

        results.forEach(row => {
            if (row.sustainable_development_goals) {
                const sdgs = row.sustainable_development_goals
                    .split('|') // assuming delimiter is "|"
                    .map(sdg => sdg.trim())
                    .filter(sdg => sdg !== '-' && sdg !== ''); // exclude '-' and empty strings

                sdgs.forEach(sdg => {
                    counts[sdg] = (counts[sdg] || 0) + 1;
                });
            }
        });

        res.json(counts);
    });
});

module.exports = router;
