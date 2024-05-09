const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utilis/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  // first finding the tour in the database
  const tour = await Tour.findById(req.params.tourId);
  console.log('Image Cover:', tour.imageCover);
  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // first is payment method types
    payment_method_types: ['card'],
    //success url that will be called as soon as the credit card has been successfully charged
    success_url: `${req.protocol}://${req.get('host')}?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, // home url
    // cancel url page user goes to cancel the current payment
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // tour page
    customer_email: req.user.email,
    // then can specify the custom field client reference id
    client_reference_id: req.params.tourId,
    // some details about the tour itself
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // these images need to be live images that are hosted on the internet because stripe will upload these images to their own server
            images: [`http://127.0.0.1:8584/img/tours/${tour.imageCover}`]
          },
          // amount the  price of the product that has been purchase x 100 to be cents 1 dollar = 100 cents
          unit_amount: tour.price * 100
        },
        quantity: 1 // 1 tour
      }
    ],
    mode: 'payment'
  });
  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

// creating bookingCheckout
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because its UNSECURE: everyone can make bookingwithout paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  // redirect is creating new request to this new url that we pass in there
  res.redirect(req.originalUrl.split('?')[0]); //homepage
});

//CRUD
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
