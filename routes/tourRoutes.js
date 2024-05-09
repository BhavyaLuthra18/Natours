const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// mounting a route
router.use('/:tourId/reviews', reviewRouter);

// aliasing
// making route easier for user to memorize
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours) // no protection because we want to expose this part of api to everyone
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  //.route('/api/v1/tours/:id')
  .route('/:id')
  .get(tourController.getTour) // get a Tour
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    // we only allow uploading images on a tour update
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//app.route('/api/v1/tours');

module.exports = router;
