const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); // simply get a cookie

//  forget and reset password
router.post('/forgotPassword', authController.forgotPassword);
// resetPassword will receive the token as well as the new password
router.patch('/resetPassword/:token', authController.resetPassword);

// all the routes that comes after this middleware are now protected
router.use(authController.protect);

// as we are manipulating the user document
router.patch('/updateMyPassword', authController.updatePassword);

// /me endpoint for user to retrieve his/her data
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

// allowing the user to delete the account but it wont be deleted from the database
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
