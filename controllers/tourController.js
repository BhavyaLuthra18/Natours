//const fs = require('fs');

const AppError = require('../utilis/appError');
const Tour = require('../models/tourModel');
const catchAsync = require('../utilis/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// this way image will be stored as buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    /// if have image
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  // field name
  //  maxCount = 1  which means this means that we will field called imageCover
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// image processing
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) Processing Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // resize to 2/3 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      // to get the current file name
      // index+1 because of 3 images
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) // resize to 2/3 ratio
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      // we need filename to push it into req.body.images
      req.body.images.push(filename);
    })
  );

  next();
});

// prefilling the query string for user so that user doesnt have to do it on its own . before it reach getAlltours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// reading
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Aggreagation pipeline

exports.getTourStats = catchAsync(async (req, res, next) => {
  // tour model to access the tour collection
  const stats = await Tour.aggregate([
    // match stage is a preliminary stage to prepare for the next stages
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        //_id: null, // as we want to calculate the average of all tours as one big group
        _id: { $toUpper: '$difficulty' }, // grouping result for different fields
        //  _id: '$ratingsAverage',
        numTours: { $sum: 1 }, // adding 1 to each document
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1 // ascending order
      }
    }
    //  {
    //   $match: {
    //    _id: { $ne: 'EASY' } // id is difficulty as mentioned above and it is not set to easy
    // }
    //   }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        numTourStarts: {
          $sum: 1 // add one for each of Tours
        },
        tours: {
          $push: '$name'
        }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0 // this will make id no longer exist // if i write 1 it will then show up
      }
    },
    {
      $sort: {
        numTourStarts: -1
      }
    },
    {
      $limit: 12 // allows us to have 6 document here
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// getting the tours within certain distance
///tours-within/:distance/center/:latlng/unit/:unit
//tours-within/233/center/-40 45/ unit/mi
// geospatial query its similar to regular query
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // To check if user actually specified latitude long of his/her loc if not then throw err
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of the lat lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});
// get exact distance to certain point
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //1 meter to mi
  const multipler = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of the lat lng.',
        400
      )
    );
  }
  // geoSpatial aggregation  pipeline  there only geoNear this has to be first in the pipeline
  // startlocation has 2d sphere geosphatial index on it

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // to specify this point as geoJSON
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },

        distanceField: 'distance',

        distanceMultiplier: multipler // / 1000
      }
    },

    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
