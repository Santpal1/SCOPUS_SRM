const db = require('../config/db');

exports.getAllFaculty = (req, res) => {
    const { sdg, domain, year } = req.query;

    const filters = [];
    if (sdg) {
        filters.push(`REPLACE(LOWER(pi.sustainable_development_goals), ' ', '') LIKE '%${sdg.toLowerCase().replace(/\s+/g, '')}%'`);
    }
    if (domain) {
        filters.push(`REPLACE(LOWER(pi.qs_subject_field_name), ' ', '') LIKE '%${domain.toLowerCase().replace(/\s+/g, '')}%'`);
    }
    if (year) {
        filters.push(`YEAR(p.date) = ${db.escape(year)}`);
    }

    const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

    const query = `
        SELECT 
            u.scopus_id,
            u.name,
            u.docs_count,
            u.access,
            u.h_index,
            (
                SELECT GROUP_CONCAT(DISTINCT pi.sustainable_development_goals SEPARATOR '|')
                FROM paper_insights pi
                JOIN papers p ON pi.doi = p.doi
                WHERE p.scopus_id = u.scopus_id
            ) AS all_sdgs,
            (
                SELECT GROUP_CONCAT(DISTINCT pi.qs_subject_field_name SEPARATOR '|')
                FROM paper_insights pi
                JOIN papers p ON pi.doi = p.doi
                WHERE p.scopus_id = u.scopus_id
            ) AS all_domains,
            (
                SELECT COUNT(*)
                FROM papers p
                LEFT JOIN paper_insights pi ON p.doi = pi.doi
                WHERE p.scopus_id = u.scopus_id
                ${whereClause}
            ) AS filtered_docs
        FROM users u
        GROUP BY u.scopus_id
    `;


    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty data' });

        const enriched = results.map(row => ({
            ...row,
            sdg: row.all_sdgs,
            domain: row.all_domains,
            docs_in_timeframe: row.filtered_docs
        }));

        res.json(enriched);
    });
};





exports.getFacultyPaperStats = (req, res) => {
    const { timeframe } = req.query;

    const currentYear = new Date().getFullYear().toString();
    const previousYear = (new Date().getFullYear() - 1).toString();

    if (timeframe !== currentYear && timeframe !== previousYear) {
        return res.status(400).json({ error: `Invalid timeframe. Only ${previousYear} and ${currentYear} are supported.` });
    }

    const startDate = `${timeframe}-01-01`;
    const endDate = `${timeframe}-12-31`;

    const query = `
        SELECT u.scopus_id, u.name, 
            (SELECT COUNT(*) FROM papers WHERE scopus_id = u.scopus_id) AS total_docs,
            COUNT(p.scopus_id) AS timeframe_docs
        FROM users u
        LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
            AND p.date >= ? AND p.date <= ?
        GROUP BY u.scopus_id, u.name;
    `;

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(results);
    });
};

exports.getLowPublishingFaculty = (req, res) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = `${currentYear - 1}-07-01`;
    const endDate = `${currentYear}-06-30`;

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
    const { sdg, domain, year } = req.query;

    db.query('SELECT * FROM users WHERE scopus_id = ?', [scopusId], (err, facultyResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty details' });
        if (!facultyResults.length) return res.status(404).json({ error: 'Faculty not found' });

        let papersQuery = `
            SELECT p.*, pi.sustainable_development_goals AS sdg, pi.qs_subject_field_name AS domain
            FROM papers p
            LEFT JOIN paper_insights pi ON p.doi = pi.doi
            WHERE p.scopus_id = ?
        `;

        const queryParams = [scopusId];
        const conditions = [];

        if (sdg) {
            conditions.push("REPLACE(LOWER(pi.sustainable_development_goals), ' ', '') LIKE ?");
            queryParams.push(`%${sdg.toLowerCase().replace(/\s+/g, '')}%`);
        }

        if (domain) {
            conditions.push("REPLACE(LOWER(pi.qs_subject_field_name), ' ', '') LIKE ?");
            queryParams.push(`%${domain.toLowerCase().replace(/\s+/g, '')}%`);
        }

        if (year) {
            conditions.push("YEAR(p.date) = ?");
            queryParams.push(year);
        }

        if (conditions.length > 0) {
            papersQuery += ' AND ' + conditions.join(' AND ');
        }

        db.query(papersQuery, queryParams, (err, papersResults) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch faculty papers' });
            res.json({ faculty: facultyResults[0], papers: papersResults });
        });
    });
};
