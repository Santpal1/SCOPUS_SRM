const db = require('../config/db');

exports.getAllFaculty = (req, res) => {
    db.query('SELECT scopus_id, name, docs_count, access FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty data' });
        res.json(results);
    });
};

exports.getFacultyPaperStats = (req, res) => {
    const { timeframe } = req.query;
    const currentYear = new Date().getFullYear();

    let startDate;
    if (timeframe === '1m') startDate = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    else if (timeframe === '6m') startDate = 'DATE_SUB(NOW(), INTERVAL 6 MONTH)';
    else if (timeframe === '1y') startDate = `'${currentYear - 1}-01-01'`;
    else if (timeframe === '2y') startDate = `'${currentYear - 2}-01-01'`;
    else return res.status(400).json({ error: 'Invalid timeframe' });

    const query = `
    SELECT u.scopus_id, u.name, 
      (SELECT COUNT(*) FROM papers WHERE scopus_id = u.scopus_id) AS total_docs,
      COUNT(p.scopus_id) AS timeframe_docs
    FROM users u
    LEFT JOIN papers p ON u.scopus_id = p.scopus_id AND p.date >= ${startDate} AND p.date <= CURDATE()
    GROUP BY u.scopus_id, u.name;
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(results);
    });
};

exports.getLowPublishingFaculty = (req, res) => {
    const lastYear = new Date().getFullYear() - 1;
    const query = `
    SELECT u.scopus_id, u.name, COUNT(p.scopus_id) AS timeframe_docs
    FROM users u
    LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
      AND p.date >= '${lastYear}-01-01' AND p.date <= CURDATE()
    GROUP BY u.scopus_id, u.name
    HAVING timeframe_docs < 4;
  `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(results);
    });
};

exports.getFacultyDetails = (req, res) => {
    const { scopusId } = req.params;

    db.query('SELECT * FROM users WHERE scopus_id = ?', [scopusId], (err, facultyResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty details' });
        if (!facultyResults.length) return res.status(404).json({ error: 'Faculty not found' });

        db.query('SELECT * FROM papers WHERE scopus_id = ?', [scopusId], (err, papersResults) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch faculty papers' });
            res.json({ faculty: facultyResults[0], papers: papersResults });
        });
    });
};