const express = require('express');

const { postAi } = require('../controllers/aiController');

const router = express.Router();

router.post('/', postAi);

module.exports = router;
