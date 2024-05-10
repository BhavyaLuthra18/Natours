const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less or equal than 40 characters '], // this can also work for dates not just numbers
      minlength: [10, 'A tour must have more or equal than 10 characters ']
      // validate: [validator.isAlpha, 'A Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration ']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'], // passes in the values that are allowed dont use it for number it is only for string
        message: 'Difficult is either :easy,medium,difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A Rating must be above 1.0'],
      max: [5, 'A Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.66666666 ,46.6666 , 47 , 47
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      // custom validator , for price discount lower then price itself
      validate: {
        validator: function(val) {
          return val < this.price; // price discount is 100 and real price is 200
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point', // it can be polgons ,others
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides:Array // embedding doc
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// indexs
//single field index
//tourSchema.index({price:1})
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// for geospatial data
// index needs 2D sphere index  if data describes real points on Earth like sphere
tourSchema.index({ startLocation: '2dsphere' });

//VIRTUAL PROPERTY
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // to calculate duration in weeks
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// MIDDLEWARE IN MONGOOSE
// DOCUMENT MIDDLEWARE : run before .save() and .create()
// pre Middleware
tourSchema.pre('save', function(next) {
  //console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// PRE Middleware
tourSchema.pre(/^find/, function(next) {
  //tourSchema.pre('find', function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v  -passwordChangedAt'
  });
  next();
});

// POST Middleware
//tourSchema.post(/^find/, function(docs, next) {
  // console.log(`Query took ${Date.now() - this.start} milliseconds`);
  //  console.log(docs);
 // next();
//});

// AGGREGATION MIDDLEWARE
//tourSchema.pre('aggregate', function(next) {
//  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// console.log(this.pipeline()); // current aggregation object
// next();
//});

const Tour = mongoose.model('Tour', tourSchema);

/*const testTour = new Tour({
    name: 'The Butterfly',
    price: 500
  });

  testTour
    .save()
    .then(doc => {
      console.log(doc);
    })
    .catch(err => {
      console.log('Error🔴', err);
    });*/
module.exports = Tour;
