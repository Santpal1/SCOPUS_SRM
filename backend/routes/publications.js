const express = require('express');
const router = express.Router();
const { getPublicationStats, getTopAuthor } = require('../controllers/statsController');

router.get('/publications', getPublicationStats);
router.get('/top-author', getTopAuthor);

module.exports = router;
