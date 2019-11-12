const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

router.post('/', async function (req, res, next) {
  try {
    let { username, email, password } = req.body;
    let userDetails = await User.createUser(username, email, password);
    return res.json(userDetails);
  } catch (err) {
    return next(err);
  }
});

router.get('/check', User.verifyJwt, async function (req, res, next) {
  try {
    let userData = await User.getUserFromUsername(req.user);
    return res.json({ user: userData });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/last-groups' }), async function (req, res, next) {
  try {
    let { username, password } = req.body;
    let token = await User.loginUser(username, password);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

router.post('/request-password-reset', async function (req, res, next) {
  try {
    let { email } = req.body
    let userData = await User.getUserFromEmail(email);
    if (userData) {
      const token = await User.createPasswordResetToken(userData);
      User.sendPasswordResetEmail(token, email);
    }
    return res.json({ message: "Success. If an email matching your account is found, you'll receive an email with instructions on how to reset your password" });
  } catch (err) {
    return next(err);
  }
});

router.post('/confirm-password-reset', async function (req, res, next) {
  try {
    let { token } = req.body;
    let { password } = req.body;
    let tokenValid = await User.verifyPasswordResetToken(token);
    if (!tokenValid) {
      return res.json({message: "Token is expired"});
    } else {
      let updatedData = await User.changePasswordWithToken(token, password);
      return res.json({message: "Password updated"});
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;