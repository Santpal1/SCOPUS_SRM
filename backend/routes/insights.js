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

module.exports = router;
