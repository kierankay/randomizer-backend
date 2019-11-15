const express = require('express');
const User = require('../models/User');
const Cohort = require('../models/Cohort');
const Student = require('../models/Student');

const router = express.Router();
router.use(User.verifyJwt)

router.get('/', async function (req, res, next) {
  try {
    let orgId = req.user.organization;
    let result = await Cohort.getCohorts(orgId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    let { cohort } = req.body;
    let orgId = req.user.organization;
    let added = await Cohort.addCohort(cohort, orgId);
    return res.json(added);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/students', async function(req, res, next) {
  try {
    let students = await Student.getStudentsFromCohort(req.params.id)
    return res.json(students);
  } catch (err) {
    return next(err);
  }
}); 

module.exports = router;