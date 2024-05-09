const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Mounting the routers
//app.get() which we use for rendering the page in the browser
//render will render the template with the name wew
// variables that we pass in here called locals in the pug file
// Testt
//router.get('/', (req, res) => {
// res.status(200).render('base', {
// tour: 'The Northern lights',
// user: 'Bhavya'
//});
//});

//overview page
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

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
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// updating the user data
// without API
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
