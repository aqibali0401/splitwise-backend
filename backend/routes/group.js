const express = require('express')
const groupController = require('../controllers/group');
const router = express.Router();
const authMiddleware = require('../middleware/auth');



router.get('/fetchGroup', [authMiddleware], groupController.fetchGroup);
router.post('/createGroup', [authMiddleware], groupController.createGroup);




module.exports = router;

