const express = require('express');
const router = express.Router();

const { getHomepageStats } = require('../controllers/homeController');

// GET /api/homepage-stats
router.get('/homepage-stats', getHomepageStats);

module.exports = router;
