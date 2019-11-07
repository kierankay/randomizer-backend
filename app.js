const express = require('express');
const ExpressError = require('./expressError');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();
const whitelist = ['http://localhost:3001', 'http://kierankay.com:3001'];
const cors = require('cors');

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

passport.use(new LocalStrategy(
  async function (username, password, done) {
    let user = await User.loginUser(username, password)
    let userToSerialize = user ? { username: username } : false;
    return done(null, userToSerialize);
  })
)

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const userRoutes = require('./routes/userRoutes')
const groupRoutes = require('./routes/groupRoutes')
const cohortRoutes = require('./routes/cohortRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/cohorts', cohortRoutes)
app.use('/api/students', studentRoutes)

/* Error handling*/

app.use(function (req, res, next) {
  const err = new ExpressError('resource not found', 404);
  return next(err);
})

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  if (process.env.NODE_ENV != "test") {
    console.error(err.stack);
  }

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;