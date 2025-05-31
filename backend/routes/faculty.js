const express = require('express');
const router = express.Router();
const {
<<<<<<< HEAD
    getAllFaculty,
    getFacultyPaperStats,
    getLowPublishingFaculty,
    getFacultyDetails
=======
  getAllFaculty,
  getFacultyPaperStats,
  getLowPublishingFaculty,
  getFacultyDetails
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
} = require('../controllers/facultyController');

router.get('/', getAllFaculty);
router.get('/papers', getFacultyPaperStats);
router.get('/low-papers', getLowPublishingFaculty);
router.get('/:scopusId', getFacultyDetails);

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
