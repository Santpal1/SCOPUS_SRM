const express = require('express');
const router = express.Router();
const {
    getPaperDetails
} = require('../controllers/paperController');


router.get('/paper/:doi', getPaperDetails);

module.exports = router;
