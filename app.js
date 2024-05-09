// App.js file is basically for middleware declarations

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // collection of multiple middleware for security htpps headers
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const app = express();
app.enable('trust proxy');
// pug - for template bulding
// letting express know which template engine to know
app.set('view engine', 'pug');
// TO tell where views folder are located
app.set('views', path.join(__dirname, 'views')); // ./views

// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//3rd Party Middleware MORGAN
// 3rd party middleware function Morgan
// that allows us to see request data right in the console
// GLOBAL MIDDLEWARES

// for  security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
); // automatically creates middleware on its own

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit request from Same API
// To prevent  denial of service and also brute force attacks where the attacker tries to guess the password of some user
// rate limit is function that recieves object of options
// max request
// timewidow - eg how many request per hour
//  windowMs - window in millseconds
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1hour
  message: 'To many requests from this IP , please try again in an hour!'
});
app.use('/api', limiter);

// Body Parder , reading data from the body into req.body
// can limit the data in the body
app.use(express.json({ limit: '10kb' })); // this return a function then that function is added to the middleware stack parses data from body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // parses data from body
// Data Sanitization  against NOSOL query injection
app.use(mongoSanitize()); // will return a middlewaree that will look at req.boy ,query ,params and filter out the dollar sign and . that how mongoDb operators are going to work and they will not work now

// Data sanitization against XSS
// this will then clean  any user input  from malicious HTML code
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    // whitelist properties for which we allow the duplicate in the query string
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
); // clear up the querystring

app.use(compression());

// ERROR HANDLING
const AppError = require('./utilis/appError');
const globalErrorHandler = require('./controllers/errorController');

// Routes
//Tour Router
const tourRouter = require('./routes/tourRoutes');
//UserRouter
const userRouter = require('./routes/userRoutes');

// Review Router
const reviewRouter = require('./routes/reviewRoutes');

// views Router
const viewRouter = require('./routes/viewRoutes');

// booking Router
const bookingRouter = require('./routes/bookingRoutes');

// MiddleWares
// creating owm middleware function
// they are applied to every single request
//app.use((req, res, next) => {
// console.log('Hello from the middleware 👋');
// next();
//});

//Test Middleware
// to manipulate the  request object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers); // so the one client can send along with their request
  //console.log(req.cookies);
  next();
});

// Mounting the routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// Errorr Handling for routes that are not unhandled or not handled by any of the two routes
// all is use for all the http methods
// to handle all the url that were not handled we use *
app.all('*', (req, res, next) => {
  //res.status(404).json({
  //  status: 'fail',
  //  message: `Can't find ${req.originalUrl} on this server!`
  // });
  //const err = new Error(`Can't find ${req.originalUrl} on this server!`); // this will be the err.message for the beloww err message
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
