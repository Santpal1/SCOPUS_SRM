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
    const { sdg, domain, year, quartileYear, start, end } = req.query;

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

        // Handle criteria filter (date range)
        if (start && end) {
            conditions.push("p.date BETWEEN ? AND ?");
            queryParams.push(start, end);
        }

        // Handle existing filters only if criteria filter is not applied
        if (!start || !end) {
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

// Performance
exports.getAuthorList = (req, res) => {
    const { search } = req.query;

    let query = `SELECT scopus_id, name FROM users`;
    let params = [];

    if (search && search.trim()) {
        query += ` WHERE LOWER(name) LIKE ? OR scopus_id LIKE ?`;
        const searchTerm = `%${search.toLowerCase()}%`;
        params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY name ASC`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Failed to fetch authors" });
        }
        res.json(results);
    });
};


exports.getAuthorPerformance = (req, res) => {
    const { scopus_id } = req.params;  // Changed from req.query to req.params
    console.log("Received request for scopus_id:", scopus_id);

    if (!scopus_id) {
        return res.status(400).json({ error: "scopus_id is required" });
    }

    // Step 1: Get author name
    db.query(
        `SELECT name FROM users WHERE scopus_id = ?`,
        [scopus_id],
        (err, authorResults) => {
            if (err) {
                console.error("DB Error (author fetch):", err);
                return res.status(500).json({ error: "Failed to fetch author" });
            }
            if (!authorResults.length) {
                return res.status(404).json({ error: "Author not found" });
            }

            const authorName = authorResults[0].name;
            console.log("Fetching chart data for scopus_id:", scopus_id);

            // Get current year and calculate last 5 years
            const currentYear = new Date().getFullYear();
            const last5Years = Array.from({ length: 5 }, (_, i) => currentYear - i);
            console.log("Filtering for last 5 years:", last5Years);

            // Step 2: Get chart data from scopus_chart_data (only last 5 years)
            const chartQuery = `
        SELECT year, documents, citations
        FROM scopus_chart_data
        WHERE scopus_id = ?
          AND year IN (${last5Years.join(',')})
        ORDER BY year DESC
      `;

            // Step 3: Get academic year data from papers table
            const academicYearQuery = `
        SELECT 
          CASE 
            WHEN date >= '2022-07-01' AND date <= '2023-06-30' THEN '2022-23'
            WHEN date >= '2023-07-01' AND date <= '2024-06-30' THEN '2023-24'
            WHEN date >= '2024-07-01' AND date <= '2025-06-30' THEN '2024-25'
          END as academic_year,
          COUNT(*) as document_count
        FROM papers
        WHERE scopus_id = ? 
          AND date >= '2022-07-01' 
          AND date <= '2025-06-30'
        GROUP BY 
          CASE 
            WHEN date >= '2022-07-01' AND date <= '2023-06-30' THEN '2022-23'
            WHEN date >= '2023-07-01' AND date <= '2024-06-30' THEN '2023-24'
            WHEN date >= '2024-07-01' AND date <= '2025-06-30' THEN '2024-25'
          END
        HAVING academic_year IS NOT NULL
        ORDER BY academic_year ASC
      `;

            // Execute both queries
            db.query(chartQuery, [scopus_id], (err, chartResults) => {
                if (err) {
                    console.error("DB Error (chart data fetch):", err);
                    return res.status(500).json({ error: "Failed to fetch chart data" });
                }

                db.query(academicYearQuery, [scopus_id], (err, academicResults) => {
                    if (err) {
                        console.error("DB Error (academic year data fetch):", err);
                        return res.status(500).json({ error: "Failed to fetch academic year data" });
                    }

                    console.log("Chart data results:", chartResults);
                    console.log("Academic year results:", academicResults);

                    // Process academic year data to ensure all 3 years are present
                    const academicYears = ['2022-23', '2023-24', '2024-25'];
                    const processedAcademicData = academicYears.map(year => {
                        const found = academicResults.find(item => item.academic_year === year);
                        return {
                            academic_year: year,
                            document_count: found ? found.document_count : 0
                        };
                    });

                    // Calculate consistency
                    const consistentYears = processedAcademicData.filter(item => item.document_count >= 3).length;
                    const inconsistentYears = 3 - consistentYears;

                    let consistencyStatus;
                    if (inconsistentYears === 0) {
                        consistencyStatus = 'green'; // Consistent all years
                    } else if (inconsistentYears === 1) {
                        consistencyStatus = 'orange'; // Not consistent 1 year
                    } else {
                        consistencyStatus = 'red'; // Not consistent more than 1 year
                    }

                    res.json({
                        name: authorName,
                        scopus_id: scopus_id,
                        chart_data: chartResults,
                        academic_year_data: processedAcademicData,
                        consistency_status: consistencyStatus
                    });
                });
            });
        }
    );
};