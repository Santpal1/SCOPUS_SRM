const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const rateLimit = require('../middleware/rateLimitMiddleware');

/**
 * GET /api/export/faculty-csv
 * Export faculty list to CSV
 * Query params: sdg, domain, year (optional)
 */
router.get(
    '/faculty-csv',
    rateLimit.apiLimiter,
    exportController.exportFacultyCSV
);

/**
 * GET /api/export/papers-csv
 * Export papers to CSV
 * Query params: facultyId, startDate, endDate, minQuartile, maxQuartile (optional)
 */
router.get(
    '/papers-csv',
    rateLimit.apiLimiter,
    exportController.exportPapersCSV
);

/**
 * GET /api/export/faculty-report/:facultyId
 * Export detailed faculty report
 * Path param: facultyId
 */
router.get(
    '/faculty-report/:facultyId',
    rateLimit.apiLimiter,
    exportController.exportFacultyReport
);

module.exports = router;
