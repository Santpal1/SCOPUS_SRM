const db = require('../config/db'); // keep your existing db.js

exports.getHomepageStats = async (req, res) => {
  try {
    const con = db.promise(); // use promise wrapper only here

    // Total citations
    const [citations] = await con.query(`
      SELECT SUM(citation_count) AS total FROM users
    `);

    // Top 3 SDGs
    const [sdgRaw] = await con.query(`
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

    // Top 3 collaborating countries (excluding India)
    const [countryRaw] = await con.query(`
      SELECT country_list FROM paper_insights WHERE country_list IS NOT NULL
    `);
    const countryCount = {};
    for (const row of countryRaw) {
      const countries = row.country_list.split('|').map(c => c.trim());
      countries.forEach(c => {
        if (c && c.toLowerCase() !== "india") {
          countryCount[c] = (countryCount[c] || 0) + 1;
        }
      });
    }
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    // Q1 paper count from past 3 years
    const [q1Data] = await con.query(`
  SELECT COUNT(*) AS total FROM faculty_quartile_summary
  WHERE quartile_2024 = 'Q1'
`);


    // Total publications in the last 1 year
    const [recentPapers] = await con.query(`
      SELECT COUNT(*) AS total FROM papers
      WHERE date >= CURDATE() - INTERVAL 1 YEAR
    `);

    // Top journal by publication count
    const [topJournalRow] = await con.query(`
      SELECT publication_name, COUNT(*) AS count
      FROM papers
      GROUP BY publication_name
      ORDER BY count DESC
      LIMIT 1
    `);
    const topJournal = topJournalRow[0] || { publication_name: 'N/A', count: 0 };

    res.json({
      totalCitations: citations[0].total || 0,
      topSDGs,
      topCountries,
      recentQ1Papers: q1Data[0].total || 0,
      recentPublications: recentPapers[0].total || 0,
      topJournal
    });

  } catch (err) {
    console.error('Error fetching homepage stats:', err);
    res.status(500).json({ error: 'Failed to fetch homepage stats' });
  }
};
