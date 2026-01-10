const db = require('../config/db');

exports.getHomepageStats = async (req, res) => {
  try {
    const con = db.promise();

    /* ---------------- TOTAL CITATIONS (FACULTY LEVEL) ---------------- */
    const [citations] = await con.query(`
      SELECT SUM(max_citations) AS total
      FROM (
        SELECT faculty_id, MAX(citations) AS max_citations
        FROM users
        WHERE faculty_id IS NOT NULL
        GROUP BY faculty_id
      ) t
    `);

    /* ---------------- TOP 3 SDGs ---------------- */
    const [sdgRaw] = await con.query(`
      SELECT sustainable_development_goals
      FROM paper_insights
      WHERE sustainable_development_goals IS NOT NULL
    `);

    const sdgCount = {};
    for (const row of sdgRaw) {
      const sdgs = row.sustainable_development_goals.split('|').map(s => s.trim());
      sdgs.forEach(sdg => {
        if (sdg) sdgCount[sdg] = (sdgCount[sdg] || 0) + 1;
        });
    }

    const topSDGs = Object.entries(sdgCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sdg, count]) => ({ sdg, count }));

    /* ---------------- TOP 3 COLLAB COUNTRIES (EXCLUDING INDIA) ---------------- */
    const [countryRaw] = await con.query(`
      SELECT country_list
      FROM paper_insights
      WHERE country_list IS NOT NULL
    `);

    const countryCount = {};
    for (const row of countryRaw) {
      const countries = row.country_list.split('|').map(c => c.trim());
      countries.forEach(c => {
        if (c && c.toLowerCase() !== 'india') {
          countryCount[c] = (countryCount[c] || 0) + 1;
        }
      });
    }

    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    /* ---------------- Q1 PAPERS (AS OF 2024 — UI MATCHED) ---------------- */
    const [q1Data] = await con.query(`
      SELECT COUNT(*) AS total
      FROM faculty_quartile_summary
      WHERE quartile_2024 = 'Q1'
    `);

    /* ---------------- TOTAL PUBLICATIONS (LAST 1 YEAR) ---------------- */
    const [recentPapers] = await con.query(`
      SELECT COUNT(*) AS total
      FROM papers
      WHERE date >= CURDATE() - INTERVAL 1 YEAR
    `);

    /* ---------------- TOP JOURNAL ---------------- */
    const [topJournalRow] = await con.query(`
      SELECT publication_name, COUNT(*) AS count
      FROM papers
      GROUP BY publication_name
      ORDER BY count DESC
      LIMIT 1
    `);

    const topJournal = topJournalRow[0] || { publication_name: 'N/A', count: 0 };

    /* ---------------- RESPONSE ---------------- */
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
