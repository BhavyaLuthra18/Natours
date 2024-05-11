const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './configg.env' });

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION 💥 Shutting down....');
  console.log(err.name, err.message);
  // code 0 = success 1 = uncaught exception

  // here its not  optional to crash application as entire node process is im so called unclean state to fix that process needs to terminate and then restarted

  process.exit(1);
});
const app = require('./app');

//const uri = process.env.MONGODB_URI;
const uri = process.env.DATABASE.replace(
  '<PASSWORD>',
  encodeURIComponent(process.env.DATABASE_PASSWORD)
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  // hosteded database version
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  // this connect return the then a promise
  // this con(connent) will be the result value of the connection
  .then(() => console.log('DB connection succesful !'));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION 💥 Shutting down....');
  console.log(err.name, err.message);
  // code 0 = success 1 = uncaught exception

  server.close(() => {
    process.exit(1);
  });
});

//console.log(X);

// SiGTERM  signal
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
