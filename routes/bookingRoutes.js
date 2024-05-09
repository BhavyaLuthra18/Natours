const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// for client checkout session
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// all this will only be accesible to administrator and lead guides
// lead guides because for them to know which tour have been booked
//  admin for update or delete tours if necessary
router.use(authController.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getAllBookings)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;
