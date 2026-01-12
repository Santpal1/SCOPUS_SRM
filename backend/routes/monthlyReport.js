const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');

// Routes for monthly reports
router.get('/monthly-report', monthlyReportController.getAllMonthlyReports);


module.exports = router;