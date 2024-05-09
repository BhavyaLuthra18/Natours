const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, ' Review can not be empty !']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // what tour it belong to
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    // who wrote the reviews
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// compound index here so that  in order to ensure that one user cannot write multiple reviews on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //      path:'tour',
  //     select:'name'
  //  })
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// average rating and rating
// statics
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // aggregation pipeline
  const stats = await this.aggregate([
    // this refer to current model
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour', // grouping all the tour together
        nRating: { $sum: 1 }, // 1 will be added from the prev review
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  // find the current tour and update that
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// use it
// calling these stats after a  new review has been created
reviewSchema.post('save', function() {
  // this is current doc and contructor is the model who created that document
  // this points to the current review
  this.constructor.calcAverageRatings(this.tour);
});

// deleting and updating review
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.review = await this.findOne();
  // console.log(this.review);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //this.review = await this.findOne(); tihs doesnot work here ,query has already executed
  await this.review.constructor.calcAverageRatings(this.review.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
