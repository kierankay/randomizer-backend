const express = require('express');
const router = express.Router();
const passport = require('passport')
const { User } = require('../functions.js')


router.post('/create', async function (req, res, next) {
  try {
    let { username, email, password } = req.body;
    let userDetails = await User.createUser(username, email, password);
    return res.json(userDetails);
  } catch (err) {
    return next(err);
  }
})

router.get('/check', User.verifyJwt, async function (req, res, next) {
  try {
    let userData = await User.getUser(req.user)
    return res.json({ user: userData });
  } catch (err) {
    return next(err);
  }
})

router.post('/login', passport.authenticate('local', { failureRedirect: '/last-groups' }), async function (req, res, next) {
  try {
    let { username, password } = req.body;
    let token = await User.loginUser(username, password);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
})

module.exports = router;