const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utilis/catchAsync');
const AppError = require('../utilis/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. if your booking doesn't show up here immediatly , please come back localStorage.";
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1)  Get tour data from the collection
  const tours = await Tour.find();
  //2) Build Templates

  //3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://js.stripe.com; connect-src 'self' ws://127.0.0.1:* https://*.mapbox.com; base-uri 'self'; block-all-mixed-content; font-src 'self' https: data:; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob:; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests;"
    );

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  //2) Build template
  //3) Render template using data form 1)
  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour
  });
});

// SignUp form
exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'create your account'
  });
};

// Login form
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login into your account'
  });
};

// user Account
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) find all the tours that user has booked
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find Tours with return IDs
  const tourIDs = bookings.map(el => el.tour);
  // finding the id in tourIds
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('UPDATING USER', req.body);
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updateUser
  });
});
