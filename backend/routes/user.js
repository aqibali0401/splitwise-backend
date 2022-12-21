const express = require('express')
const userController = require('../controllers/user');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


router.get('/', userController.getUsers);
router.post('/addFriends', [authMiddleware], userController.addFriends);
router.get('/fetchFriends', [authMiddleware], userController.fetchFriends);
router.get('/fetchUserDetails', [authMiddleware], userController.fetchUserDetails);
router.post('/inviteFriend', [authMiddleware], userController.inviteFriend);


module.exports = router;

