const express = require('express');
const router = express.Router();

const {
  addCohort,
  getCohorts,
  User,
  getStudentsFromCohort
} = require('../functions.js')

router.get('/', async function (req, res, next) {
  try {
    let result = await getCohorts()
    return res.json(result);
  } catch (err) {
    return next(err);
  }
})

router.post('/', User.verifyJwt, async function (req, res, next) {
  try {
    let { cohort } = req.body;
    let added = await addCohort(cohort);
    return res.json(added);
  } catch (err) {
    return next(err);
  }
})

router.get('/:id/students', User.verifyJwt, async function(req, res, next) {
  try {
    let students = await getStudentsFromCohort(req.params.id)
    return res.json(students);
  } catch (err) {
    return next(err);
  }
}); 

module.exports = router;