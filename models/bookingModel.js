const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  // price at which purchase happen as price might change in near future
  price: {
    type: Number,
    require: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  // ex if the administrator wants to create a booking outside of stripe and doesnt have a credit card in that adminstartor might then use bookings api to manually create a tour and so that might then be paid or not yet paid
  paid: {
    type: Boolean,
    default: true
  }
});

// populate user and tour automatically if there is a query
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
