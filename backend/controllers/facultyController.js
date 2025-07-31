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

// Existing imports
exports.getCriteriaFilteredFaculty = (req, res) => {
    const { start, end, papers } = req.query;

    if (!start || !end || !papers) {
        return res.status(400).json({ error: "Start date, end date, and paper count are required." });
    }

    const query = `
        SELECT u.scopus_id, u.name, COUNT(p.scopus_id) AS timeframe_docs
        FROM users u
        LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
            AND p.date >= ? AND p.date <= ?
        GROUP BY u.scopus_id, u.name
        HAVING timeframe_docs < ?;
    `;

    db.query(query, [start, end, parseInt(papers)], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
        res.json(results);
    });
};




exports.getFacultyDetails = (req, res) => {
    const { scopusId } = req.params;
    const { sdg, domain, year, quartileYear } = req.query;

    db.query('SELECT * FROM users WHERE scopus_id = ?', [scopusId], (err, facultyResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch faculty details' });
        if (!facultyResults.length) return res.status(404).json({ error: 'Faculty not found' });

        // Validate quartileYear
        let safeQuartileYear = quartileYear;
        if (!/^\d{4}$/.test(safeQuartileYear)) {
            safeQuartileYear = '2024'; // fallback
        }

        let queryParams = [scopusId];
        let baseQuery = `
      SELECT 
        p.*, 
        pi.sustainable_development_goals AS sdg, 
        pi.qs_subject_field_name AS domain,
        fqs.quartile_2022,
        fqs.quartile_2023,
        fqs.quartile_2024,
        fqs.quartile_${safeQuartileYear} AS quartile_value
      FROM papers p
      LEFT JOIN paper_insights pi ON p.doi = pi.doi
      LEFT JOIN faculty_quartile_summary fqs ON p.doi = fqs.doi AND fqs.scopus_id = ?
    `;

        const conditions = ['p.scopus_id = ?'];
        queryParams.push(scopusId); // second usage of scopus_id (for WHERE)

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

        baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        baseQuery += ` AND fqs.quartile_${safeQuartileYear} IS NOT NULL`;
        baseQuery += ` ORDER BY p.date DESC`;

        db.query(baseQuery, queryParams, (err, papersResults) => {
            if (err) {
                console.error("❌ Query Error:", err);
                return res.status(500).json({ error: 'Failed to fetch faculty papers' });
            }

            // Inject quartile info
            papersResults.forEach(paper => {
                paper.quartile = paper.quartile_value || null;
                paper.quartile_year = safeQuartileYear;

                // Add all available quartiles as an object
                paper.quartiles = {};
                Object.keys(paper).forEach(key => {
                    const match = key.match(/^quartile_(\d{4})$/);
                    if (match && paper[key]) {
                        const year = match[1];
                        paper.quartiles[year] = paper[key]; // e.g., Q2
                    }
                });
            });

            res.json({ faculty: facultyResults[0], papers: papersResults });
        });
    });
};




exports.getFacultyQuartileSummary = (req, res) => {
    const { scopusId } = req.params;

    const query = `SELECT * FROM faculty_quartile_summary WHERE scopus_id = ?`;

    db.query(query, [scopusId], (err, rows) => {
        if (err) {
            console.error("Quartile summary error:", err);
            return res.status(500).json({ error: 'Failed to fetch quartile summary' });
        }

        const summaryByYear = {}; // { "2024": { q1_count: x, q2_count: y, ... } }

        for (const row of rows) {
            for (const key of Object.keys(row)) {
                const match = key.match(/^quartile_(\d{4})$/); // match quartile_2024 etc.
                if (match) {
                    const year = match[1];
                    const quartile = row[key];

                    if (!summaryByYear[year]) {
                        summaryByYear[year] = { q1_count: 0, q2_count: 0, q3_count: 0, q4_count: 0 };
                    }

                    switch (quartile) {
                        case 'Q1': summaryByYear[year].q1_count++; break;
                        case 'Q2': summaryByYear[year].q2_count++; break;
                        case 'Q3': summaryByYear[year].q3_count++; break;
                        case 'Q4': summaryByYear[year].q4_count++; break;
                    }
                }
            }
        }

        res.json(summaryByYear);
    });
};
