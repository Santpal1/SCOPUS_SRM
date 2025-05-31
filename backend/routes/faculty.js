const express = require('express');
const router = express.Router();
const {
    getAllFaculty,
    getFacultyPaperStats,
    getLowPublishingFaculty,
    getFacultyDetails
} = require('../controllers/facultyController');

router.get('/', getAllFaculty);
router.get('/papers', getFacultyPaperStats);
router.get('/low-papers', getLowPublishingFaculty);
router.get('/:scopusId', getFacultyDetails);

module.exports = router;
