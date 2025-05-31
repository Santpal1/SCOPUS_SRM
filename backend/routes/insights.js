const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route: GET /api/insights/countries
router.get('/countries', (req, res) => {
    db.query('SELECT country_list FROM paper_insights', (err, rows) => {
        if (err) {
            console.error('Error fetching country data:', err);
            return res.status(500).json({ error: 'Failed to fetch country data' });
        }

        if (!rows || rows.length === 0) {
            return res.json([]);
        }

        const countryCounts = {};

        rows.forEach((row, i) => {
            const list = row.country_list;

            if (list) {
                const countries = list.split(/[|,]/).map(c => c.trim());
                countries.forEach(country => {
                    if (country) {
                        countryCounts[country] = (countryCounts[country] || 0) + 1;
                    }
                });
            }
        });

        const formatted = Object.entries(countryCounts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count);

        res.json(formatted);
    });
});

// routes/insights.js
// Route: GET /api/insights/sdg-counts
router.get('/sdg-counts', (req, res) => {
    db.query('SELECT sustainable_development_goals FROM paper_insights', (err, rows) => {
        if (err) {
            console.error('Error fetching SDG data:', err);
            return res.status(500).json({ error: 'Failed to fetch SDG data' });
        }

        if (!rows || rows.length === 0) {
            return res.json({});
        }

        const sdgMap = {
            '1': 'No Poverty',
            '2': 'Zero Hunger',
            '3': 'Good Health and Well-being',
            '4': 'Quality Education',
            '5': 'Gender Equality',
            '6': 'Clean Water and Sanitation',
            '7': 'Affordable and Clean Energy',
            '8': 'Decent Work and Economic Growth',
            '9': 'Industry, Innovation and Infrastructure',
            '10': 'Reduced Inequality',
            '11': 'Sustainable Cities and Communities',
            '12': 'Responsible Consumption and Production',
            '13': 'Climate Action',
            '14': 'Life Below Water',
            '15': 'Life on Land',
            '16': 'Peace, Justice and Strong Institutions',
            '17': 'Partnerships for the Goals'
        };

        const sdgCounts = {};

        rows.forEach(row => {
            const field = row.sustainable_development_goals;
            if (!field) return;

            const sdgs = field.split(/[|,]/).map(s => s.trim()).filter(Boolean);

            sdgs.forEach(sdg => {
                const label = sdgMap[sdg] || sdg;
                sdgCounts[label] = (sdgCounts[label] || 0) + 1;
            });
        });

        res.json(sdgCounts);
    });
});


module.exports = router;
