const express = require('express');
const router = express.Router();
const {
    getAllFaculty,
    getFacultyPaperStats,
    getFacultyDetails,
    getFacultyQuartileSummary,
    getCriteriaFilteredFaculty,
    getAuthorList,
    getAuthorPerformance
} = require('../controllers/facultyController');

// Add middleware to log all requests
router.use((req, res, next) => {
    console.log('Faculty route hit:', req.method, req.url);
    next();
});

// Keep the more specific routes BEFORE the parameterized ones
router.get('/author-list', getAuthorList);
router.get('/author-performance/:scopus_id', (req, res) => {
    console.log('Author performance route hit with scopus_id:', req.params.scopus_id);
    getAuthorPerformance(req, res);
});
router.get('/', getAllFaculty);
router.get('/papers', getFacultyPaperStats);
router.get('/criteria-filter', getCriteriaFilteredFaculty);
router.get('/:scopusId/quartile-summary', getFacultyQuartileSummary);
router.get('/:scopusId', getFacultyDetails);

module.exports = router;