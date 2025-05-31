const express = require('express');
const router = express.Router();
const {
<<<<<<< HEAD
    getPaperDetails
=======
  getPaperDetails
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
} = require('../controllers/paperController');


router.get('/paper/:doi', getPaperDetails);

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
