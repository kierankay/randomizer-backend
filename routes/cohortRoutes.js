const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cohort = require('../models/Cohort');
const Student = require('../models/Student');

router.get('/', async function (req, res, next) {
  try {
    let result = await Cohort.getCohorts()
    return res.json(result);
  } catch (err) {
    return next(err);
  }
})

router.post('/', User.verifyJwt, async function (req, res, next) {
  try {
    let { cohort } = req.body;
    let added = await Cohort.addCohort(cohort);
    return res.json(added);
  } catch (err) {
    return next(err);
  }
})

router.get('/:id/students', User.verifyJwt, async function(req, res, next) {
  try {
    let students = await Student.getStudentsFromCohort(req.params.id)
    return res.json(students);
  } catch (err) {
    return next(err);
  }
}); 

module.exports = router;