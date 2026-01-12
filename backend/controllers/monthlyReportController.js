// controllers/monthlyReportController.js

const db = require('../config/db'); // Use the same db connection as other controllers

/**
 * Get all monthly reports with optional filters
 * Query params: year, month
 */
/**
 * Get all monthly reports with optional filters
 * Query params: year, month
 */
const getAllMonthlyReports = (req, res) => {
    const { year, month } = req.query;

    // Calculate previous month if no filters
    let defaultYear = year;
    let defaultMonth = month;
    if (!year || year === 'all') {
        const now = new Date();
        defaultYear = now.getMonth() === 0 ? (now.getFullYear() - 1).toString() : now.getFullYear().toString();
        defaultMonth = now.getMonth() === 0 ? '12' : (now.getMonth()).toString();
    }

    // Use provided or default for join
    const joinYear = year && year !== 'all' ? year : defaultYear;
    const joinMonth = month && month !== 'all' ? month : defaultMonth;

    let query = `
      SELECT 
        u.faculty_id,
        u.faculty_name as faculty_name,
        u.scopus_id,
        COALESCE(mar.docs_added, 0) as docs_added,
        COALESCE(mar.citations_added, 0) as citations_added,
        COALESCE(mar.total_docs, u.docs_count) as total_docs,
        COALESCE(mar.total_citations, u.citations) as total_citations,
        mar.report_year,
        mar.report_month,
        mar.created_at
      FROM users u
      LEFT JOIN monthly_author_report mar ON u.scopus_id = mar.scopus_id AND mar.report_year = ? AND mar.report_month = ?
      WHERE u.scopus_id IS NOT NULL
    `;

    const queryParams = [parseInt(joinYear), parseInt(joinMonth)];

    // Order by faculty name
    query += ' ORDER BY u.faculty_name ASC';

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching monthly reports:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch monthly report data',
                message: err.message
            });
        }

        res.status(200).json(results);
    });
};

/**
 * Get monthly report for a specific author by Scopus ID
 * Params: scopus_id
 * Query params: year, month
 */
const getMonthlyReportByAuthor = (req, res) => {
    const { scopus_id } = req.params;
    const { year, month } = req.query;

    let query = `
      SELECT 
        mar.id,
        mar.scopus_id,
        mar.faculty_id,
        mar.report_year,
        mar.report_month,
        mar.docs_added,
        mar.citations_added,
        mar.total_docs,
        mar.total_citations,
        mar.created_at,
        u.faculty_name
      FROM monthly_author_report mar
      LEFT JOIN users u ON mar.faculty_id = u.faculty_id
      WHERE mar.scopus_id = ?
    `;

    const queryParams = [scopus_id];

    // Add year filter if provided
    if (year && year !== 'all') {
        query += ' AND mar.report_year = ?';
        queryParams.push(parseInt(year));
    }

    // Add month filter if provided
    if (month && month !== 'all') {
        query += ' AND mar.report_month = ?';
        queryParams.push(parseInt(month));
    }

    // Order by most recent first
    query += ' ORDER BY mar.report_year DESC, mar.report_month DESC';

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching author monthly report:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch author monthly report',
                message: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No reports found for this author'
            });
        }

        res.status(200).json(results);
    });
};

/**
 * Get monthly report by faculty ID
 * Params: faculty_id
 * Query params: year, month
 */
const getMonthlyReportByFacultyId = (req, res) => {
    const { faculty_id } = req.params;
    const { year, month } = req.query;

    let query = `
      SELECT 
        mar.id,
        mar.scopus_id,
        mar.faculty_id,
        mar.report_year,
        mar.report_month,
        mar.docs_added,
        mar.citations_added,
        mar.total_docs,
        mar.total_citations,
        mar.created_at,
        u.faculty_name
      FROM monthly_author_report mar
      LEFT JOIN users u ON mar.faculty_id = u.faculty_id
      WHERE mar.faculty_id = ?
    `;

    const queryParams = [faculty_id];

    if (year && year !== 'all') {
        query += ' AND mar.report_year = ?';
        queryParams.push(parseInt(year));
    }

    if (month && month !== 'all') {
        query += ' AND mar.report_month = ?';
        queryParams.push(parseInt(month));
    }

    query += ' ORDER BY mar.report_year DESC, mar.report_month DESC';

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching faculty monthly report:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch faculty monthly report',
                message: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No reports found for this faculty member'
            });
        }

        res.status(200).json(results);
    });
};

/**
 * Get summary statistics for monthly reports
 * Query params: year, month
 */
const getMonthlyReportSummary = (req, res) => {
    const { year, month } = req.query;

    let query = `
      SELECT 
        COUNT(DISTINCT scopus_id) as total_authors,
        COUNT(*) as total_records,
        SUM(docs_added) as total_docs_added,
        SUM(citations_added) as total_citations_added,
        AVG(docs_added) as avg_docs_per_author,
        AVG(citations_added) as avg_citations_per_author,
        MAX(docs_added) as max_docs_added,
        MAX(citations_added) as max_citations_added
      FROM monthly_author_report
      WHERE 1=1
    `;

    const queryParams = [];

    if (year && year !== 'all') {
        query += ' AND report_year = ?';
        queryParams.push(parseInt(year));
    }

    if (month && month !== 'all') {
        query += ' AND report_month = ?';
        queryParams.push(parseInt(month));
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching summary stats:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch summary statistics',
                message: err.message
            });
        }

        res.status(200).json(results[0] || {});
    });
};

/**
 * Get top performing authors for a specific period
 * Query params: year, month, limit (default: 10), sortBy (docs_added or citations_added)
 */
const getTopPerformers = (req, res) => {
    const { year, month, limit = 10, sortBy = 'docs_added' } = req.query;

    // Validate sortBy parameter
    const validSortFields = ['docs_added', 'citations_added', 'total_docs', 'total_citations'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'docs_added';

    let query = `
      SELECT 
        mar.scopus_id,
        mar.faculty_id,
        u.faculty_name,
        SUM(mar.docs_added) as total_docs_added,
        SUM(mar.citations_added) as total_citations_added,
        AVG(mar.total_docs) as avg_total_docs,
        AVG(mar.total_citations) as avg_total_citations,
        COUNT(*) as report_count
      FROM monthly_author_report mar
      LEFT JOIN users u ON mar.faculty_id = u.faculty_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (year && year !== 'all') {
        query += ' AND mar.report_year = ?';
        queryParams.push(parseInt(year));
    }

    if (month && month !== 'all') {
        query += ' AND mar.report_month = ?';
        queryParams.push(parseInt(month));
    }

    query += ` 
      GROUP BY mar.scopus_id, mar.faculty_id, u.faculty_name
      ORDER BY total_${sortField.replace('docs_added', 'docs_added').replace('citations_added', 'citations_added')} DESC
      LIMIT ?
    `;

    queryParams.push(parseInt(limit));

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching top performers:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch top performers',
                message: err.message
            });
        }

        res.status(200).json(results);
    });
};

/**
 * Get available years from the database
 */
const getAvailableYears = (req, res) => {
    const query = `
      SELECT DISTINCT report_year as year
      FROM monthly_author_report
      ORDER BY report_year DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching available years:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch available years',
                message: err.message
            });
        }

        res.status(200).json(results.map(row => row.year));
    });
};

/**
 * Get monthly trends (aggregated by month)
 * Query params: year
 */
const getMonthlyTrends = (req, res) => {
    const { year } = req.query;

    let query = `
      SELECT 
        report_year,
        report_month,
        COUNT(DISTINCT scopus_id) as author_count,
        SUM(docs_added) as total_docs,
        SUM(citations_added) as total_citations,
        AVG(docs_added) as avg_docs,
        AVG(citations_added) as avg_citations
      FROM monthly_author_report
      WHERE 1=1
    `;

    const queryParams = [];

    if (year && year !== 'all') {
        query += ' AND report_year = ?';
        queryParams.push(parseInt(year));
    }

    query += `
      GROUP BY report_year, report_month
      ORDER BY report_year DESC, report_month DESC
    `;

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching monthly trends:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch monthly trends',
                message: error.message
            });
        }

        res.status(200).json(results);
    });
};

module.exports = {
    getAllMonthlyReports,
    getMonthlyReportByAuthor,
    getMonthlyReportByFacultyId,
    getMonthlyReportSummary,
    getTopPerformers,
    getAvailableYears,
    getMonthlyTrends
};