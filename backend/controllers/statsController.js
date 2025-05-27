const db = require('../config/db');

exports.getPublicationStats = (req, res) => {
  const { timeframe } = req.query;

  let startDate;
  if (timeframe === '6m') startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m')";
  else if (timeframe === '1y') startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m')";
  else if (timeframe === '2y') startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 YEAR), '%Y-%m')";
  else return res.status(400).json({ error: 'Invalid timeframe' });

  const query = `
    SELECT DATE_FORMAT(date, '%Y-%m') AS month, COUNT(*) AS count
    FROM papers
    WHERE DATE_FORMAT(date, '%Y-%m') BETWEEN ${startDate} AND DATE_FORMAT(CURDATE(), '%Y-%m')
    AND date <= CURDATE()
    GROUP BY month
    ORDER BY month ASC;
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch data' });
    res.json(results);
  });
};

exports.getTopAuthor = (req, res) => {
  const { timeframe } = req.query;

  let startDate;
  if (timeframe === '6m') startDate = 'DATE_SUB(NOW(), INTERVAL 6 MONTH)';
  else if (timeframe === '1y') startDate = 'DATE_SUB(NOW(), INTERVAL 12 MONTH)';
  else if (timeframe === '2y') startDate = 'DATE_SUB(NOW(), INTERVAL 24 MONTH)';
  else return res.status(400).json({ error: 'Invalid timeframe' });

  const query = `
    WITH author_counts AS (
      SELECT u.scopus_id, u.name, COUNT(p.scopus_id) AS timeframe_docs
      FROM users u
      JOIN papers p ON u.scopus_id = p.scopus_id 
      AND p.date >= ${startDate} AND p.date <= CURDATE()
      GROUP BY u.scopus_id, u.name
    ),
    max_count AS (
      SELECT MAX(timeframe_docs) AS max_pub FROM author_counts
    )
    SELECT * FROM author_counts WHERE timeframe_docs = (SELECT max_pub FROM max_count);
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch top authors' });
    res.json(results);
  });
};
