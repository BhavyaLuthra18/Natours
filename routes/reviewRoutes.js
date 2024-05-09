const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  // only authenticated users to post reviews and also only users that are usally regular users  // not administators and alsp not tour guides
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(reviewController.deleteReview);

module.exports = router;
