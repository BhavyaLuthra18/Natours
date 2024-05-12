const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(viewsController.alerts);

// Overview page
router.route('/').get(authController.isLoggedIn, viewsController.getOverview);
// route for specific tour
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// login
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

//signup
router.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);

// me
// only if  user logged in gets access to this page
router.get('/me', authController.protect, viewsController.getAccount);

// My bookings
router
  .route('/my-bookings')
  .get(authController.protect, viewsController.getMyBookings);

// updating the user data
// without API
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
