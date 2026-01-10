const db = require('../config/db');

exports.getAllFaculty = (req, res) => {
    const { sdg, domain, year } = req.query;

    const filters = [];

    if (sdg) {
        filters.push(`
            REPLACE(LOWER(pi.sustainable_development_goals), ' ', '') 
            LIKE '%${sdg.toLowerCase().replace(/\s+/g, '')}%'
        `);
    }

    if (domain) {
        filters.push(`
            REPLACE(LOWER(pi.qs_subject_field_name), ' ', '') 
            LIKE '%${domain.toLowerCase().replace(/\s+/g, '')}%'
        `);
    }

    if (year) {
        filters.push(`YEAR(p.date) = ${db.escape(year)}`);
    }

    const whereClause = filters.length ? `AND ${filters.join(" AND ")}` : "";

    const query = `
        SELECT
            u.faculty_id,
            u.faculty_name,
            MAX(u.docs_count) AS docs_count,
            MAX(u.access_level) AS access_level,
            MAX(u.h_index) AS h_index,

            -- Aggregate all Scopus IDs that belong to this faculty (multiple rows per faculty)
            GROUP_CONCAT(DISTINCT u.scopus_id SEPARATOR '|') AS scopus_ids,

            GROUP_CONCAT(DISTINCT pi.sustainable_development_goals SEPARATOR '|') AS all_sdgs,
            GROUP_CONCAT(DISTINCT pi.qs_subject_field_name SEPARATOR '|') AS all_domains,

            COUNT(DISTINCT p.doi) AS filtered_docs

        FROM users u
        LEFT JOIN papers p ON u.scopus_id = p.scopus_id
        LEFT JOIN paper_insights pi ON p.doi = pi.doi

        WHERE u.faculty_id IS NOT NULL
        ${whereClause}

        GROUP BY u.faculty_id, u.faculty_name
        ORDER BY u.faculty_name;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch faculty data" });
        }

        const enriched = results.map(row => ({
            faculty_id: row.faculty_id,
            name: row.faculty_name,
            docs_count: row.docs_count,
            access_level: row.access_level,
            h_index: row.h_index,
            sdg: row.all_sdgs,
            domain: row.all_domains,
            docs_in_timeframe: row.filtered_docs,
            scopus_ids: row.scopus_ids ? row.scopus_ids.split('|').filter(Boolean) : []
        }));

        res.json(enriched);
    });
};



exports.getFacultyPaperStats = (req, res) => {
    const { timeframe } = req.query;

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    if (![currentYear.toString(), previousYear.toString()].includes(timeframe)) {
        return res.status(400).json({
            error: `Invalid timeframe. Only ${previousYear} and ${currentYear} are supported.`
        });
    }

    const startDate = `${timeframe}-01-01`;
    const endDate = `${timeframe}-12-31`;

    const query = `
        SELECT
            u.faculty_id,
            u.faculty_name,

            GROUP_CONCAT(DISTINCT u.scopus_id SEPARATOR '|') AS scopus_ids,

            COUNT(DISTINCT p_all.doi) AS total_docs,
            COUNT(DISTINCT p_time.doi) AS timeframe_docs

        FROM users u

        LEFT JOIN papers p_all
            ON u.scopus_id = p_all.scopus_id

        LEFT JOIN papers p_time
            ON u.scopus_id = p_time.scopus_id
            AND p_time.date BETWEEN ? AND ?

        WHERE u.faculty_id IS NOT NULL

        GROUP BY u.faculty_id, u.faculty_name
        ORDER BY u.faculty_name;
    `;

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }

        const enriched = results.map(row => ({
            ...row,
            scopus_ids: row.scopus_ids ? row.scopus_ids.split('|').filter(Boolean) : []
        }));

        res.json(enriched);
    });
};

exports.getCriteriaFilteredFaculty = (req, res) => {
    const { start, end, papers } = req.query;

    const conditions = [];
    const params = [];

    if (start && end) {
        conditions.push(`p.date BETWEEN ? AND ?`);
        params.push(start, end);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    let query = `
        SELECT
            u.faculty_id,
            u.faculty_name,
            GROUP_CONCAT(DISTINCT u.scopus_id SEPARATOR '|') AS scopus_ids,
            COUNT(DISTINCT p.doi) AS timeframe_docs
        FROM users u
        LEFT JOIN papers p
            ON u.scopus_id = p.scopus_id
        ${whereClause}
        GROUP BY u.faculty_id, u.faculty_name
    `;

    if (papers) {
        query += ` HAVING timeframe_docs <= ?`;
        params.push(parseInt(papers));
    }

    query += ` ORDER BY u.faculty_name;`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Failed to fetch data" });
        }

        const enriched = results.map(row => ({
            ...row,
            scopus_ids: row.scopus_ids ? row.scopus_ids.split('|').filter(Boolean) : []
        }));

        res.json(enriched);
    });
};


exports.getFacultyDetails = (req, res) => {
    const { facultyId } = req.params;
    const { sdg, domain, year, quartileYear, start, end } = req.query;

    // 1️⃣ Fetch faculty (single identity)
    db.query(
        `
        SELECT *
        FROM users
        WHERE faculty_id = ?
        LIMIT 1
        `,
        [facultyId],
        (err, facultyResults) => {
            if (err) return res.status(500).json({ error: "Failed to fetch faculty details" });
            if (!facultyResults.length) return res.status(404).json({ error: "Faculty not found" });

            // Attach aggregated scopus_ids for this faculty
            db.query(
                `
                SELECT
                    GROUP_CONCAT(DISTINCT scopus_id SEPARATOR '|') AS scopus_ids,
                    SUM(COALESCE(citations, 0)) AS citation_count,
                    SUM(COALESCE(docs_count, 0)) AS docs_count,
                    MAX(COALESCE(h_index, 0)) AS h_index
                FROM users
                WHERE faculty_id = ?
                `,
                [facultyId],
                (err2, idRows) => {
                    if (err2) console.warn('Failed to aggregate scopus_ids and metrics:', err2);

                    const scopusArr =
                        idRows?.[0]?.scopus_ids
                            ? idRows[0].scopus_ids.split('|').filter(Boolean)
                            : [];

                    // Merge aggregated metrics into faculty object so front-end shows faculty-level totals
                    const faculty = {
                        ...facultyResults[0],
                        scopus_ids: scopusArr,
                        citation_count: idRows?.[0]?.citation_count || facultyResults[0].citations || 0,
                        docs_count: idRows?.[0]?.docs_count || facultyResults[0].docs_count || 0,
                        h_index: idRows?.[0]?.h_index || facultyResults[0].h_index || null
                    };
                    let safeQuartileYear = quartileYear;
                    if (!/^\d{4}$/.test(safeQuartileYear)) {
                        safeQuartileYear = "2024";
                    }

                    const queryParams = [facultyId, facultyId];

                    let baseQuery = `
                        SELECT
                            p.*,
                            pi.sustainable_development_goals AS sdg,
                            pi.qs_subject_field_name AS domain,

                            fqs.quartile_2022,
                            fqs.quartile_2023,
                            fqs.quartile_2024,
                            fqs.quartile_${safeQuartileYear} AS quartile_value

                        FROM users u
                        JOIN papers p
                            ON u.scopus_id = p.scopus_id
                        LEFT JOIN paper_insights pi
                            ON p.doi = pi.doi
                        LEFT JOIN faculty_quartile_summary fqs
                            ON p.doi = fqs.doi
                           AND p.scopus_id = fqs.scopus_id
                    `;

                    const conditions = [`u.faculty_id = ?`];

                    // Date range filter
                    if (start && end) {
                        conditions.push("p.date BETWEEN ? AND ?");
                        queryParams.push(start, end);
                    }

                    // Apply SDG / domain / year filters only if date range not used
                    if (!start || !end) {
                        if (sdg) {
                            conditions.push(
                                "REPLACE(LOWER(pi.sustainable_development_goals), ' ', '') LIKE ?"
                            );
                            queryParams.push(`%${sdg.toLowerCase().replace(/\s+/g, "")}%`);
                        }

                        if (domain) {
                            conditions.push(
                                "REPLACE(LOWER(pi.qs_subject_field_name), ' ', '') LIKE ?"
                            );
                            queryParams.push(`%${domain.toLowerCase().replace(/\s+/g, "")}%`);
                        }

                        if (year) {
                            conditions.push("YEAR(p.date) = ?");
                            queryParams.push(year);
                        }
                    }

                    baseQuery += ` WHERE ${conditions.join(" AND ")}`;
                    baseQuery += ` ORDER BY p.date DESC`;

                    db.query(baseQuery, queryParams, (err, papersResults) => {
                        if (err) {
                            console.error("❌ Query Error:", err);
                            return res.status(500).json({ error: "Failed to fetch faculty papers" });
                        }

                        // 2️⃣ Enrich quartile info
                        papersResults.forEach(paper => {
                            paper.quartile = paper.quartile_value || null;
                            paper.quartile_year = safeQuartileYear;

                            paper.quartiles = {};
                            Object.keys(paper).forEach(key => {
                                const match = key.match(/^quartile_(\d{4})$/);
                                if (match && paper[key]) {
                                    paper.quartiles[match[1]] = paper[key];
                                }
                            });
                        });

                        res.json({
                            faculty,
                            papers: papersResults
                        });
                    });
                }
            );
        }
    );
};


exports.getFacultyQuartileSummary = (req, res) => {
    const { facultyId } = req.params;

    // 1️⃣ Get all scopus_ids for this faculty
    db.query(
        `
        SELECT DISTINCT scopus_id
        FROM users
        WHERE faculty_id = ?
        `,
        [facultyId],
        (err, scopusRows) => {
            if (err) {
                console.error("Scopus ID fetch error:", err);
                return res.status(500).json({ error: "Failed to fetch faculty scopus IDs" });
            }

            if (!scopusRows.length) {
                return res.status(404).json({ error: "Faculty not found" });
            }

            const scopusIds = scopusRows.map(r => r.scopus_id);

            // 2️⃣ Fetch quartile data using scopus_ids
            const query = `
                SELECT *
                FROM faculty_quartile_summary
                WHERE scopus_id IN (?)
            `;

            db.query(query, [scopusIds], (err2, rows) => {
                if (err2) {
                    console.error("Quartile summary error:", err2);
                    return res.status(500).json({ error: "Failed to fetch quartile summary" });
                }

                // 3️⃣ Aggregate year-wise quartiles
                const summaryByYear = {};

                for (const row of rows) {
                    for (const key of Object.keys(row)) {
                        const match = key.match(/^quartile_(\d{4})$/);
                        if (!match) continue;

                        const year = match[1];
                        const quartile = row[key];

                        if (!summaryByYear[year]) {
                            summaryByYear[year] = {
                                q1_count: 0,
                                q2_count: 0,
                                q3_count: 0,
                                q4_count: 0
                            };
                        }

                        switch (quartile) {
                            case "Q1": summaryByYear[year].q1_count++; break;
                            case "Q2": summaryByYear[year].q2_count++; break;
                            case "Q3": summaryByYear[year].q3_count++; break;
                            case "Q4": summaryByYear[year].q4_count++; break;
                        }
                    }
                }

                res.json(summaryByYear);
            });
        }
    );
};


// Performance
exports.getAuthorList = (req, res) => {
    const { search, h_index_filter } = req.query;

    const whereClauses = ['u.scopus_id IS NOT NULL'];
    const params = [];

    // Search by faculty name or scopus id
    if (search && search.trim()) {
        whereClauses.push(`(LOWER(u.faculty_name) LIKE ? OR u.scopus_id LIKE ?)`);
        params.push(`%${search.toLowerCase()}%`, `%${search}%`);
    }

    // Build base query: return one row per Scopus ID with a name and h_index
    let query = `
        SELECT
            u.scopus_id AS scopus_id,
            u.faculty_name AS name,
            MAX(u.h_index) AS h_index
        FROM users u
        WHERE ${whereClauses.join(" AND ")}
        GROUP BY u.scopus_id, u.faculty_name
    `;

    // H-index filter (applies to the aggregated MAX(h_index))
    if (h_index_filter && h_index_filter !== "none") {
        let hIndexCondition = null;

        switch (h_index_filter) {
            case "1-3":
                hIndexCondition = `MAX(u.h_index) BETWEEN 1 AND 3`;
                break;
            case "4-6":
                hIndexCondition = `MAX(u.h_index) BETWEEN 4 AND 6`;
                break;
            case "7-9":
                hIndexCondition = `MAX(u.h_index) BETWEEN 7 AND 9`;
                break;
            case "10-12":
                hIndexCondition = `MAX(u.h_index) BETWEEN 10 AND 12`;
                break;
            case "12+":
                hIndexCondition = `MAX(u.h_index) > 12`;
                break;
        }

        if (hIndexCondition) {
            query += ` HAVING ${hIndexCondition}`;
        }
    }

    query += ` ORDER BY h_index DESC, name ASC`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ error: "Failed to fetch authors" });
        }

        // Map to the expected frontend schema (scopus_id, name, h_index)
        const mapped = results.map(r => ({
            scopus_id: r.scopus_id,
            name: r.name,
            h_index: r.h_index
        }));

        res.json(mapped);
    });
};


exports.getAuthorPerformance = (req, res) => {
    const facultyId = req.params.facultyId;
    const scopusId = req.params.scopus_id;

    const id = facultyId || scopusId;
    if (!id) {
        return res.status(400).json({ error: "id (facultyId or scopus_id) is required" });
    }

    // Determine whether we're working at faculty level or single scopus id
    const isScopus = Boolean(scopusId);

    // 1️⃣ Fetch identity + h-index
    const identityQuery = isScopus
        ? `
            SELECT
                faculty_name,
                MAX(h_index) AS h_index
            FROM users
            WHERE scopus_id = ?
            GROUP BY scopus_id, faculty_name
        `
        : `
            SELECT
                faculty_name,
                MAX(h_index) AS h_index
            FROM users
            WHERE faculty_id = ?
            GROUP BY faculty_id, faculty_name
        `;

    db.query(identityQuery, [id], (err, facultyResults) => {
        if (err) {
            console.error("DB Error (identity fetch):", err);
            return res.status(500).json({ error: "Failed to fetch identity" });
        }
        if (!facultyResults.length) {
            return res.status(404).json({ error: "Author not found" });
        }

        const facultyName = facultyResults[0].faculty_name;
        const facultyHIndex = facultyResults[0].h_index;

        const currentYear = new Date().getFullYear();
        const last5Years = Array.from({ length: 5 }, (_, i) => currentYear - i);

        // 2️⃣ Chart data: if scopus id use sc.scopus_id = ?, else aggregate by faculty_id
        const chartQuery = isScopus
            ? `
                SELECT
                    sc.year,
                    sc.documents AS documents,
                    sc.citations AS citations
                FROM scopus_chart_data sc
                WHERE sc.scopus_id = ?
                  AND sc.year IN (${last5Years.join(",")})
                ORDER BY sc.year DESC
            `
            : `
                SELECT
                    sc.year,
                    SUM(sc.documents) AS documents,
                    SUM(sc.citations) AS citations
                FROM scopus_chart_data sc
                JOIN users u ON sc.scopus_id = u.scopus_id
                WHERE u.faculty_id = ?
                  AND sc.year IN (${last5Years.join(",")})
                GROUP BY sc.year
                ORDER BY sc.year DESC
            `;

        // 3️⃣ Academic year logic
        const academicYears = Array.from({ length: 3 }, (_, i) => {
            const start = currentYear - i - 1;
            const end = currentYear - i;
            return `${start}-${String(end).slice(-2)}`;
        }).reverse();

        const caseConditions = academicYears.map(ay => {
            const [startYear, endYearShort] = ay.split("-");
            const endYear = `20${endYearShort}`;
            return `
                WHEN p.date >= '${startYear}-07-01'
                 AND p.date <= '${endYear}-06-30'
                THEN '${ay}'
            `;
        }).join("\n");

        const academicYearQuery = isScopus
            ? `
                SELECT 
                    CASE 
                        ${caseConditions}
                    END AS academic_year,
                    COUNT(DISTINCT p.doi) AS document_count
                FROM users u
                JOIN papers p ON u.scopus_id = p.scopus_id
                WHERE u.scopus_id = ?
                  AND p.date >= '${academicYears[0].split("-")[0]}-07-01'
                  AND p.date <= '${currentYear}-06-30'
                GROUP BY academic_year
                HAVING academic_year IS NOT NULL
                ORDER BY academic_year ASC
            `
            : `
                SELECT 
                    CASE 
                        ${caseConditions}
                    END AS academic_year,
                    COUNT(DISTINCT p.doi) AS document_count
                FROM users u
                JOIN papers p ON u.scopus_id = p.scopus_id
                WHERE u.faculty_id = ?
                  AND p.date >= '${academicYears[0].split("-")[0]}-07-01'
                  AND p.date <= '${currentYear}-06-30'
                GROUP BY academic_year
                HAVING academic_year IS NOT NULL
                ORDER BY academic_year ASC
            `;

        // Execute chart query
        db.query(chartQuery, [id], (err, chartResults) => {
            if (err) {
                console.error("DB Error (chart data fetch):", err);
                return res.status(500).json({ error: "Failed to fetch chart data" });
            }

            // Execute academic year query
            db.query(academicYearQuery, [id], (err, academicResults) => {
                if (err) {
                    console.error("DB Error (academic year fetch):", err);
                    return res.status(500).json({ error: "Failed to fetch academic year data" });
                }

                // Ensure all 3 academic years exist
                const processedAcademicData = academicYears.map(year => {
                    const found = academicResults.find(r => r.academic_year === year);
                    return {
                        academic_year: year,
                        document_count: found ? found.document_count : 0
                    };
                });

                // Consistency logic (unchanged)
                const consistentYears = processedAcademicData.filter(
                    y => y.document_count >= 2
                ).length;

                let consistencyStatus;
                if (consistentYears === 3) {
                    consistencyStatus = "green";
                } else if (consistentYears === 2) {
                    consistencyStatus = "orange";
                } else {
                    consistencyStatus = "red";
                }

                res.json({
                    id,
                    name: facultyName,
                    h_index: facultyHIndex,
                    chart_data: chartResults,
                    academic_year_data: processedAcademicData,
                    consistency_status: consistencyStatus
                });
            });
        });
    });
};
