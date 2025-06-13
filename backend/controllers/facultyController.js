const db = require('../config/db');

exports.getAllFaculty = (req, res) => {
    db.query('SELECT scopus_id, name, docs_count, access FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty data' });
        res.json(results);
    });
};

exports.getFacultyPaperStats = (req, res) => {
    const { timeframe } = req.query;

    // Validate that the timeframe is either 2024 or 2025
    if (timeframe !== '2024' && timeframe !== '2025') {
        return res.status(400).json({ error: 'Invalid timeframe. Only 2024 and 2025 are supported.' });
    }

    const startDate = `'${timeframe}-01-01'`;
    const endDate = `'${timeframe}-12-31'`;

    const query = `
        SELECT u.scopus_id, u.name, 
            (SELECT COUNT(*) FROM papers WHERE scopus_id = u.scopus_id) AS total_docs,
            COUNT(p.scopus_id) AS timeframe_docs
        FROM users u
        LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
            AND p.date >= ${startDate} AND p.date <= ${endDate}
        GROUP BY u.scopus_id, u.name;
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(results);
    });
};


exports.getLowPublishingFaculty = (req, res) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = `${currentYear - 1}-07-01`; // 1 July of last year
    const endDate = `${currentYear}-06-30`;       // 30 June of current year

    const query = `
        SELECT u.scopus_id, u.name, COUNT(p.scopus_id) AS timeframe_docs
        FROM users u
        LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
            AND p.date >= '${startDate}' AND p.date <= '${endDate}'
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
