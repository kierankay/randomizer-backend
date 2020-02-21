// Cohort routes include nested group and student routes

const express = require('express');
const User = require('../models/User');
const Cohort = require('../models/Cohort');
const Student = require('../models/Student');
const Pair = require('../models/Pair');
const { randomizePairs } = require('../helpers/randomizePairs');

const router = express.Router();
router.use(User.verifyJwt);

// COHORT ROUTES

/*
  Fetch all cohorts for logged in user's org
  ex: GET /api/cohorts/
*/

router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization;
    const result = await Cohort.getCohorts(orgId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/*
  Create a new cohort for logged in users's org
  ex: POST /api/cohorts/
  body: {
    cohort: "r13"
  }
*/


router.post('/', async (req, res, next) => {
  try {
    const { cohort } = req.body;
    const orgId = req.user.organization;
    const added = await Cohort.addCohort(cohort, orgId);
    return res.json(added);
  } catch (err) {
    return next(err);
  }
});

// COHORT > GROUP ROUTES

/*
  Fetch up to "limit" number of groups from a given cohort
  ex: GET /api/cohorts/1/groups
*/

router.get('/:id/groups', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const { limit } = req.query;
    const result = await Pair.getLastPairs(limit, cohortId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/*
  Generate (but do not save) a new group of randomized students from the cohort
  Users may hit this API multiple times they are satisfied with student pairs before saving
  ex: GET /api/cohorts/1/groups/random
*/

router.get('/:id/groups/random', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const { min_paired_ago: minPairedAgo } = req.query;
    const list = await Student.getStudentsFromCohort(cohortId);
    const edgeList = await Pair.getPairsEdgeList(minPairedAgo, cohortId);
    const pairs = await randomizePairs(list, edgeList, minPairedAgo);
    return res.json(pairs);
  } catch (err) {
    return next(err);
  }
});

/*
  Save a new group of randomized students from the cohort
  ex: POST /api/cohorts/1/groups
  body: {
    project: "First group project",
    group:
  }
*/

router.post('/:id/groups', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const { group, project } = req.body;
    const acceptedPairs = await Pair.acceptPairs(group, project, cohortId);
    return res.json(acceptedPairs);
  } catch (err) {
    return next(err);
  }
});

// COHORT > STUDENT ROUTES

/*
  Fetch all students from a specific cohort
  ex: GET /api/cohorts/1/students
*/

router.get('/:id/students', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const students = await Student.getStudentsFromCohort(cohortId);
    return res.json(students);
  } catch (err) {
    return next(err);
  }
});

/*
  Add a student to a cohort
  ex: POST /api/cohorts/1/students
  body {
    first_name: "Kieran",
    last_name: "Kay"
  }
*/

router.post('/:id/students', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const student = req.body;
    student.cohort = cohortId;
    const result = await Student.addStudent(student);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/*
  Get a limit-filtered edge list of pairs
  ex: GET /api/cohorts/1/pairs?limit=1
  body {
    [
      {
        "student1_id": 6,
        "student2_id": null,
        "group_id": 5
      }
    ]
  }
*/

router.get('/:id/pairs', async (req, res, next) => {
  try {
    const cohortId = req.params.id;
    const { limit } = req.query;
    const result = await Pair.getPairsList(limit, cohortId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
