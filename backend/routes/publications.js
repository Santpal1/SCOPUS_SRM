const express = require('express');
const router = express.Router();
const { getPublicationStats, getTopAuthor } = require('../controllers/statsController');

router.get('/publications', getPublicationStats);
router.get('/top-author', getTopAuthor);

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
