const express = require('express');
const User = require('../models/User');
const router = express.Router();

/*
  Create a new user account
  ex: POST /api/users/
  body: {
    firstName: "Kieran",
    lastName: "Kay",
    organization: "Rithm School",
    email: "kierankay@rithmschool.com",
    password: "bobiscool"
  }
*/

router.post('/', async function (req, res, next) {
  try {
    let { firstName, lastName, organization, email, password } = req.body;
    let result = await User.createUser( firstName, lastName, organization, email, password );
    console.log(result);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/*
  Check if a user has a valid auth token
  ex: GET /api/users/check
*/

router.get('/check', User.verifyJwt, async function (req, res, next) {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    return next(err);
  }
});


/*
  Log a user in
  ex: POST /api/users/login
  body: {
    email: "kierankay@rithmschool.com",
    password: "bobiscool"
  }
*/

// refactor to use passport.authenticate('local') middleware in the future

router.post('/login', async function (req, res, next) {
  try {
    let { email, password } = req.body;
    let result = await User.loginUser(email, password);

    // If there's an error message, return the message with its default "message" key
    if (result.message) {
      return res.json(result);

      // Otherwise return the token in a key of "token"
    } else {
      return res.json({ token: result });
    }
  } catch (err) {
    return next(err);
  }
});

/*
  Email a user a URL to reset their password
  ex: POST /api/users/request-password-reset
  body: {
    email: "kierankay@rithmschool.com"
  }
*/

router.post('/request-password-reset', async function (req, res, next) {
  try {
    let { email } = req.body
    let userData = await User.checkUserByEmail(email);
    if (userData) {
      const token = await User.createPasswordResetToken(userData);
      User.sendPasswordResetEmail(token, email);
    }
    return res.json({ message: "Success. If an email matching your account is found, you'll receive an email with instructions on how to reset your password" });
  } catch (err) {
    return next(err);
  }
});

/*
  Verify that a submitted a password reset token is valid and return true or false
  ex: POST /api/users/request-password-reset
  body: {
    passwordToken: "valid.token.data"
  }
*/

router.post('/check-password-token', async function (req, res, next) {
  try {
    let { passwordToken } = req.body
    let tokenValid = await User.verifyPasswordResetToken(passwordToken);
    return res.json({tokenValid})
  } catch (err) {
    return next(err);
  }
});

/*
  Reset a user's password using a valid password reset token and the new password
  ex: POST /api/users/confirm-password-reset
  body: {
    passwordToken: "valid.token.data",
    password: "BOBisEvencoolernow!!"
  }
*/

router.post('/confirm-password-reset', async function (req, res, next) {
  try {
    let { passwordToken, password } = req.body;
    let tokenValid = await User.verifyPasswordResetToken(passwordToken);
    if (!tokenValid) {
      return res.json({message: "Token is expired"});
    } else {
      let updatedData = await User.changePasswordWithToken(passwordToken, password);
      return res.json({message: "Password updated"});
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

/* 

// Refactor to passport.js based auth in the future.

const passport = require('passport'); 

*/