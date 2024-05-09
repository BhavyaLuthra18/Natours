//const util = require('util');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utilis/catchAsync');
const AppError = require('../utilis/appError');
const Email = require('../utilis/email');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res, req) => {
  const token = signToken(user._id);
  const cookieOptions = {
    // browser or client will delete the coookie after it has expired
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // cookie cannot be access or modified by the browser browser will recieve - store it - sent it automatically along with every request
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  res.cookie('jwt', token, cookieOptions);
  // remove the password set it to undefined
  user.password = undefined;
  // statusCode - 201 is for created
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); // HERE as everyone can simply register as an admin into our application serious security flaw
  // we only all the data that need to be put in the new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`; // upload photo
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  // After the token is created then sent it back to client
  createSendToken(newUser, 201, res, req);
});

// Login User
exports.login = catchAsync(async (req, res, next) => {
  // getting the email and password of user through destructing from req.body
  const { email, password } = req.body;
  // 1)  Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  //2) Check if user exists && password is correct
  // we used select couple of fields  that we needed but in this case we need the  field that is bydefault not selected we use plus and the name of the field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 400)); // bad request
  }

  // 3) if everything is ok , send token to client
  createSendToken(user, 200, res, req);
});

// Log out user by passing dummy token instead and expires in 10 seconds
exports.logout = (req, res) => {
  //console.log('Logout route accessed');
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};
// all we want the response for logging is actually the token
// Step 2 of authorization
// Proteted Routes  /// giving access to only users that are logged in of protected routes
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // Check if res.cookies exists
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in!  Please log in to get access.', 401)
    );
  }

  //2) Verification token (JWT algorithm verifies if the signature is valid or not
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id); // its the user based on the decoded id
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  //4) Check if user changed password after the token is issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password ! Please log in .', 401)
    );
  }
  // Grant access to protected route
  // then to put user data on the request
  req.user = currentUser;
  // req.locals and pug template will get access to it
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // req.locals and pug template will get access to it
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// authorization for  setting rules on users even if they are logged in

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles[('admin', 'lead-guide')]; //if role = 'user ' and its not in this array thn user doesnt have the permission
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// if user forget password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  /// 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email
  //const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to :${resetURL}.\nIf you didn;t forgot your password , Please ingore this email!`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //  email: user.email,
    //  subject: 'Your password reset token (valid for 10 min)',
    //  message
    //  });

    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Trying again later'),
      500
    );
  }
});

// update Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // reset password based on the user sends with reset password request
  //1) Get uder based on the the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2) if token has not expired and  there is a user , set the new password
  // if token has expired well then it will simply be no user there
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) Update changedPasswordAt property for the user
  //4) Log the user in . send JWT
  createSendToken(user, 200, res, req);
});

// if the logged in user want to update the password
// password updating functionality is for logged-in user
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 404)); // 404 - authorized
  }
  //3) If so . update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in , send JWT
  createSendToken(user, 200, res, req);
});
