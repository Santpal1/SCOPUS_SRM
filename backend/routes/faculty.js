const express = require('express');
const router = express.Router();
const {
    getAllFaculty,
    getFacultyPaperStats,
    getFacultyDetails,
    getFacultyQuartileSummary,
    getCriteriaFilteredFaculty
} = require('../controllers/facultyController');


router.get('/', getAllFaculty);
router.get('/papers', getFacultyPaperStats);
router.get('/criteria-filter', getCriteriaFilteredFaculty);
router.get('/:scopusId', getFacultyDetails);
router.get('/:scopusId/quartile-summary', getFacultyQuartileSummary);

module.exports = router;
