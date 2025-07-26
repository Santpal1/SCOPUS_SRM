const db = require('../config/db'); // adjust path based on your setup

exports.getHomepageStats = async (req, res) => {
  try {
    // Total citations
    const [citations] = await db.query(`
      SELECT SUM(citation_count) AS total FROM users
    `);

    // Top 3 SDGs
    const [sdgRaw] = await db.query(`
      SELECT sustainable_development_goals FROM paper_insights
      WHERE sustainable_development_goals IS NOT NULL
    `);
    const sdgCount = {};
    for (const row of sdgRaw) {
      const sdgs = row.sustainable_development_goals.split('|').map(s => s.trim());
      sdgs.forEach(sdg => {
        if (sdg) {
          sdgCount[sdg] = (sdgCount[sdg] || 0) + 1;
        }
      });
    }
    const topSDGs = Object.entries(sdgCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sdg, count]) => ({ sdg, count }));

    // Top 3 collaborating countries
    const [countryRaw] = await db.query(`
      SELECT country_list FROM paper_insights WHERE country_list IS NOT NULL
    `);
    const countryCount = {};
    for (const row of countryRaw) {
      const countries = row.country_list.split('|').map(c => c.trim());
      countries.forEach(c => {
        if (c) {
          countryCount[c] = (countryCount[c] || 0) + 1;
        }
      });
    }
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    // Q1 paper count from past 3 years
    const [q1Data] = await db.query(`
      SELECT SUM(q1_count) AS total FROM faculty_quartile_summary
      WHERE year >= YEAR(CURDATE()) - 2
    `);

    res.json({
      totalCitations: citations[0].total || 0,
      topSDGs,
      topCountries,
      recentQ1Papers: q1Data[0].total || 0,
    });
  } catch (err) {
    console.error('Error fetching homepage stats:', err);
    res.status(500).json({ error: 'Failed to fetch homepage stats' });
  }
};
