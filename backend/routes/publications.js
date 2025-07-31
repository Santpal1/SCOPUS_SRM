const express = require('express');
const router = express.Router();
const { getPublicationStats, getTopAuthor, getQuartileStats } = require('../controllers/statsController');

router.get('/publications', getPublicationStats);
router.get('/top-author', getTopAuthor);
router.get('/quartile-stats', getQuartileStats); // removed extra /api

module.exports = router;
