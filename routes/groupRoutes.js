const express = require('express');
const User = require('../models/User');
const Pair = require('../models/Pair');
const Student = require('../models/Student');

const router = express.Router();
router.use(User.verifyJwt)

const { randomizePairs } = require('../helpers/helpers');

router.get('/', async function (req, res, next) {
  try {
    let { limit, cohort } = req.query
    let result = await Pair.getLastPairs(limit, cohort)
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.get('/random-group', async function (req, res, next) {
  try {
    let { cohort, min_paired_ago } = req.query;
    let list = await Student.getStudentsFromCohort(cohort)
    let pairs = await randomizePairs(list, min_paired_ago)
    return res.json(pairs)
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    let { group, project, cohort } = req.body;
    let acceptedPairs = await Pair.acceptPairs(group, project, cohort)
    return res.json(acceptedPairs)
  } catch (err) {
    return next(err);
  }
});

module.exports = router;