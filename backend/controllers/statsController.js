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
    FROM scopus.papers
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      AND date <= CURDATE()
    GROUP BY month
    ORDER BY month ASC;
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch data' });
    res.json(results);
  });
};

// ---------- 2. Top Author ----------
exports.getTopAuthor = (req, res) => {
  const { timeframe } = req.query;

  let interval;
  if (timeframe === '6m') interval = '6 MONTH';
  else if (timeframe === '1y') interval = '1 YEAR';
  else if (timeframe === '2y') interval = '2 YEAR';
  else return res.status(400).json({ error: 'Invalid timeframe' });

  const query = `
    SELECT u.scopus_id, u.name, COUNT(p.scopus_id) AS timeframe_docs
    FROM scopus.users u
    JOIN scopus.papers p ON u.scopus_id = p.scopus_id
    WHERE p.date >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      AND p.date <= CURDATE()
    GROUP BY u.scopus_id, u.name
    HAVING timeframe_docs = (
      SELECT MAX(pub_count) FROM (
        SELECT COUNT(p2.scopus_id) AS pub_count
        FROM scopus.users u2
        JOIN scopus.papers p2 ON u2.scopus_id = p2.scopus_id
        WHERE p2.date >= DATE_SUB(CURDATE(), INTERVAL ${interval})
          AND p2.date <= CURDATE()
        GROUP BY u2.scopus_id
      ) AS sub
    );
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch top authors' });
    res.json(results);
  });
};

// ---------- 3. Quartile Stats ----------
exports.getQuartileStats = (req, res) => {
  const { year } = req.query;

  let column = '';
  if (year === '2022') column = 'quartile_2022';
  else if (year === '2023') column = 'quartile_2023';
  else if (year === '2024') column = 'quartile_2024';

  const mapCase = (col) => `
    CASE 
        WHEN UPPER(TRIM(${col})) IN ('1','Q1') THEN 'Q1'
        WHEN UPPER(TRIM(${col})) IN ('2','Q2') THEN 'Q2'
        WHEN UPPER(TRIM(${col})) IN ('3','Q3') THEN 'Q3'
        WHEN UPPER(TRIM(${col})) IN ('4','Q4') THEN 'Q4'
        ELSE 'UNKNOWN'
    END
  `;

  let query = '';
  if (column) {
    // Single year
    query = `
      SELECT ${mapCase(column)} AS quartile, COUNT(*) AS count
      FROM scopus.faculty_quartile_summary
      WHERE ${column} IS NOT NULL AND ${column} != ''
      GROUP BY quartile;
    `;
  } else {
    // Combined for all years
    query = `
      SELECT quartile, COUNT(*) AS count FROM (
        SELECT ${mapCase('quartile_2022')} AS quartile FROM scopus.faculty_quartile_summary WHERE quartile_2022 IS NOT NULL AND quartile_2022 != ''
        UNION ALL
        SELECT ${mapCase('quartile_2023')} FROM scopus.faculty_quartile_summary WHERE quartile_2023 IS NOT NULL AND quartile_2023 != ''
        UNION ALL
        SELECT ${mapCase('quartile_2024')} FROM scopus.faculty_quartile_summary WHERE quartile_2024 IS NOT NULL AND quartile_2024 != ''
      ) AS combined
      GROUP BY quartile;
    `;
  }

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch quartile stats' });

    const quartiles = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    results.forEach(r => {
      if (r.quartile && quartiles.hasOwnProperty(r.quartile)) {
        quartiles[r.quartile] = r.count;
      }
    });

    res.json(quartiles);
  });
};
