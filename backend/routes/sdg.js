const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // change if needed
    database: 'scopus',
    port: 3307 // default port
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
