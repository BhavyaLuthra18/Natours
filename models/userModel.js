const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, // reset will actually expire after a certain amount of time as a security measure as you only have 10 mins to actually reset your password
  active: {
    type: Boolean,
    default: true,
    select: false // as we dont want user to see this active flag so set it to false
  }
});

// password encryption
// document middleware

userSchema.pre('save', async function(next) {
  // only run if the password is actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12

  this.password = await bcrypt.hash(this.password, 12);
  // Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  // if didnot modify the password property  then donot manipulate the passwordChangedAt or if the document is new
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});
// verifying the password is same as its stored in the document
// userpassword is hashed
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// if the user changed the password after JWT is issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //  console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changeTimestamp; // 100 < 200
  }

  return false;
};

// if user forget password and  to sent it with reset token that is randomTOken not JWT token
userSchema.methods.createPasswordResetToken = function() {
  // password reset token should be  RANDOM String  but it does not need to cryptographically strong as password hash
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // now want to sent the plain text token that we are going to sent in email
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
