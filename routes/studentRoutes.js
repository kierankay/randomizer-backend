const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');

const router = express.Router();

router.post('/', User.verifyJwt, async function (req, res, next) {
  try {
    let student = await Student.addStudent(req.body);
    return res.json(student);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;