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

// finish this based on (https://github.com/kierankay/randomizer-backend/issues/4)
// check if userData.length > 0 && create new password reset token.

router.post('/request-password', async function (req, res, next) {
  try {
    let { email } = req.body
    let userData = await User.getUserFromEmail(email);
    return res.json({ user: userData });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;