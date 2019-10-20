const express = require('express');
const router = express.Router();
const {
  createListOfStudents,
  randomizePairs,
  acceptPairs,
  getLastPairs,
  User
} = require('../functions.js')

router.get('/', async function (req, res, next) {
  try {
    let limit = req.query.limit
    let cohort = req.query.cohort
    let result = await getLastPairs(limit, cohort)
    return res.json(result);
  } catch (err) {
    return next(err);
  }
})

router.get('/random-group', async function (req, res, next) {
  try {
    let { cohort, min_paired_ago } = req.query;
    let list = await createListOfStudents(cohort)
    let pairs = await randomizePairs(list, min_paired_ago)
    return res.json(pairs)
  } catch (err) {
    return next(err);
  }
})

router.post('/', User.verifyJwt, async function (req, res, next) {
  try {
    let { group, project, cohort } = req.body;
    let acceptedPairs = await acceptPairs(group, project, cohort)
    return res.json(acceptedPairs)
  } catch (err) {
    return next(err);
  }
})

module.exports = router;