const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const validation = require('../middleware/validationMiddleware');
const rateLimit = require('../middleware/rateLimitMiddleware');

/**
 * GET /api/search/global
 * Global search across faculty and papers
 * Query params: q (search query), type (faculty|papers|all)
 */
router.get(
    '/global',
    validation.validateQueryParams,
    searchController.globalSearch
);

/**
 * GET /api/search/advanced
 * Advanced search with filters
 * Query params: facultyName, scopusId, startDate, endDate, minHIndex, maxHIndex, sdg, domain
 */
router.get(
    '/advanced',
    validation.validateQueryParams,
    searchController.advancedSearch
);

/**
 * GET /api/search/papers
 * Search papers by criteria
 * Query params: title, doi, scopusId, startDate, endDate, minQuartile, maxQuartile
 */
router.get(
    '/papers',
    validation.validateQueryParams,
    searchController.searchPapers
);

module.exports = router;
