const express = require('express');
const router = express.Router();
const {
    getAllFaculty,
    getFacultyPaperStats,
    getFacultyDetails,
    getFacultyQuartileSummary,
    getCriteriaFilteredFaculty,
    getAuthorList,
    getAuthorPerformance,
    getScopusChart,
    getScopusChartForFaculty
} = require('../controllers/facultyController');

// Add middleware to log all requests
router.use((req, res, next) => {
    console.log('Faculty route hit:', req.method, req.url);
    next();
});

// Keep the more specific routes BEFORE the parameterized ones
router.get('/author-list', getAuthorList);
// Support both scopus_id and facultyId routes for author performance
router.get('/author-performance/:scopus_id', (req, res) => {
    console.log('Author performance route hit with scopus_id:', req.params.scopus_id);
    getAuthorPerformance(req, res);
});
router.get('/:facultyId/author-performance', (req, res) => {
    console.log('Author performance route hit for facultyId:', req.params.facultyId);
    getAuthorPerformance(req, res);
});

// Raw scopus chart data endpoints (debugging / CSV export)
router.get('/scopus-chart/:scopus_id', (req, res) => {
    console.log('Scopus chart route hit for scopus_id:', req.params.scopus_id);
    getScopusChart(req, res);
});
router.get('/:facultyId/scopus-chart', (req, res) => {
    console.log('Scopus chart route hit for facultyId:', req.params.facultyId);
    getScopusChartForFaculty(req, res);
});
router.get('/', getAllFaculty);
router.get('/papers', getFacultyPaperStats);
router.get('/criteria-filter', getCriteriaFilteredFaculty);
router.get('/:facultyId/quartile-summary', getFacultyQuartileSummary);
router.get('/:facultyId', getFacultyDetails);

module.exports = router;