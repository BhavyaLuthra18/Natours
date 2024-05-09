const User = require('../models/userModel');
const AppError = require('../utilis/appError');
const catchAsync = require('../utilis/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

//const multerStorage = multer.diskStorage({
// destination: (req, file, cb) => {
// second argument is the actuall destination
// cb(null, 'public/img/users');
// },
// filename: (req, file, cb) => {
// giving the files the unique file names
// user-userid-the current timestamp-fileextension
//user-789788p9p9pba-3333332346677.jpeg
// ext - extension
//  const ext = file.mimetype.split('/')[1];
// cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
// }
//});

// this way image will be stored as buffer
const multerStorage = multer.memoryStorage();

// multer filter
// goal is to test if the uploaded file is image or not
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    /// if have image
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// destination
// where we want to save the image that has been uploaded
//const upload = multer({
//  dest: 'public/img/users'
//});
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// allowing logged-in user to update his/her user data
// .single  because here we only want to update one single image
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // if upload the image resizing  for that sharp package
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next(); // updateMe
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
// Route handlers
// /me endpoint
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Allowing the logged-in user to manipulate his/her user data
// user itself can now update the name and the email id
exports.updateMe = catchAsync(async (req, res, next) => {
  //console.log(req.file);
  //console.log(req.body);
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }
  //2) Filtered out unwanted fields that are not allowed to be updated
  //3) Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
// delete the user but not deleting the account from the database by seting the state active as false so that in the near future if the user want to active his/her account again
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // 204: deleted
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  // for route is not implemented
  // 500 - internal server error
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// this only for administratot and only for updating data that is not the password
// Dont update password with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
