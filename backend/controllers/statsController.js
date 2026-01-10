const db = require('../config/db');

// ---------- 1. Publication Stats ----------
exports.getPublicationStats = (req, res) => {
  const { timeframe } = req.query;

  let interval;
  if (timeframe === '6m') interval = '6 MONTH';
  else if (timeframe === '1y') interval = '1 YEAR';
  else if (timeframe === '2y') interval = '2 YEAR';
  else return res.status(400).json({ error: 'Invalid timeframe' });

  const query = `
    SELECT DATE_FORMAT(date, '%Y-%m') AS month, COUNT(*) AS count
    FROM papers
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      AND date <= CURDATE()
    GROUP BY month
    ORDER BY month ASC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.json(results);
  });
};

// ---------- 2. Top Faculty ----------
exports.getTopAuthor = (req, res) => {
  const { timeframe } = req.query;

  let interval;
  if (timeframe === '6m') interval = '6 MONTH';
  else if (timeframe === '1y') interval = '1 YEAR';
  else if (timeframe === '2y') interval = '2 YEAR';
  else return res.status(400).json({ error: 'Invalid timeframe' });

  // Build the base aggregation (counts per faculty)
  const baseAggregation = `
    SELECT
      u.faculty_id,
      u.faculty_name,
      COUNT(DISTINCT p.doi) AS timeframe_docs
    FROM users u
    JOIN papers p ON u.scopus_id = p.scopus_id
    WHERE p.date >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      AND p.date <= CURDATE()
      AND u.faculty_id IS NOT NULL
    GROUP BY u.faculty_id, u.faculty_name
  `;

  // Select all faculties that have the maximum timeframe_docs (handles ties)
  const query = `
    SELECT t.faculty_id, t.faculty_name, t.timeframe_docs
    FROM (
      ${baseAggregation}
    ) t
    WHERE t.timeframe_docs = (
      SELECT MAX(t2.timeframe_docs) FROM (
        ${baseAggregation}
      ) t2
    );
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch top faculty' });
    }

    // Return an array of top author objects (possibly empty)
    res.json(results);
  });
};

// ---------- 3. Quartile Stats ----------
exports.getQuartileStats = (req, res) => {
  const { year } = req.query;

  const mapCase = (col) => `
    CASE 
      WHEN UPPER(TRIM(${col})) IN ('1','Q1') THEN 'Q1'
      WHEN UPPER(TRIM(${col})) IN ('2','Q2') THEN 'Q2'
      WHEN UPPER(TRIM(${col})) IN ('3','Q3') THEN 'Q3'
      WHEN UPPER(TRIM(${col})) IN ('4','Q4') THEN 'Q4'
      ELSE NULL
    END
  `;

  let query = '';

  // 🔒 Explicitly supported years ONLY
  if (year === '2022' || year === '2023' || year === '2024') {
    const column = `quartile_${year}`;
    query = `
      SELECT ${mapCase(column)} AS quartile, COUNT(*) AS count
      FROM faculty_quartile_summary
      WHERE ${column} IS NOT NULL AND ${column} != ''
      GROUP BY quartile;
    `;
  } else {
    // Combined stats for all AVAILABLE years only
    query = `
      SELECT quartile, COUNT(*) AS count FROM (
        SELECT ${mapCase('quartile_2022')} AS quartile
        FROM faculty_quartile_summary
        WHERE quartile_2022 IS NOT NULL AND quartile_2022 != ''

        UNION ALL

        SELECT ${mapCase('quartile_2023')}
        FROM faculty_quartile_summary
        WHERE quartile_2023 IS NOT NULL AND quartile_2023 != ''

        UNION ALL

        SELECT ${mapCase('quartile_2024')}
        FROM faculty_quartile_summary
        WHERE quartile_2024 IS NOT NULL AND quartile_2024 != ''
      ) t
      WHERE quartile IS NOT NULL
      GROUP BY quartile;
    `;
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch quartile stats' });
    }

    const quartiles = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    results.forEach(r => {
      if (quartiles[r.quartile] !== undefined) {
        quartiles[r.quartile] = r.count;
      }
    });

    res.json(quartiles);
  });
};
