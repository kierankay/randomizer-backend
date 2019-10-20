const express = require('express');
const router = express.Router();

const {
  addStudent,
  User
} = require('../functions.js')


router.post('/', User.verifyJwt, async function (req, res, next) {
  try {
    let student = await addStudent(req.body);
    return res.json(student);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;