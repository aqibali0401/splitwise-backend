const express = require('express')
const authController = require('../controllers/auth');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


router.post('/createuser', authController.createUser);
router.post('/login', authController.loginUser);
router.get('/logout', authController.logoutUser);
router.get('/forgot-password', authController.forgotPasswordGet);
router.post('/forgot-password', authController.forgotPasswordPost);
router.get('/reset-password/:token', authController.resetPasswordGet);
router.post('/reset-password/:id/:token', authController.resetPasswordPost);
router.post('/inviteFriend', [authMiddleware], authController.inviteFriend);





module.exports = router;

