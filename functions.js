const db = require('./db')
const bcrypt = require('bcrypt');
const { NUM_ROUNDS, SECRET_KEY } = require('./config')
const jwt = require('jsonwebtoken');

async function randomizePairs(studentsList, minRepeatDistance) {
  // Prevent infinite loops by disallowing impossible min repeat distances
  minRepeatDistance = minRepeatDistance > studentsList.length - 2 ? studentsList.length - 2 : minRepeatDistance

  // Create a copy of the list, that we can cut students out of to create pairs
  // to eliminate potential repetitions
  let tempStudentsList = studentsList.slice()
  let pairs = []
  while (tempStudentsList.length > 0) {
    // Initialize a round counter to make sure we don't get stuck in an infinite loop
    // If a min-paired-ago constrained set of pairs is impossible
    let roundCount = 0;
    let pair = {}

    // Get the first student from a random index and add them to a new pair
    let idx = randomizeListIndex(tempStudentsList);
    let student1 = tempStudentsList.splice(idx, 1)[0]
    pair = addStudentToPair(pair, student1)


    while (Object.keys(pair).length < 2 && tempStudentsList.length > 0) {
      // Pick a random remaining student and check how long ago they paired with the first student
      idx = randomizeListIndex(tempStudentsList);
      let lastPairedDistance = await lastPaired(pair.student_1, tempStudentsList[idx]);

      // Increment the round counter
      roundCount += 1;

      // If the last time they paired is an acceptable distance ago
      // Add the pair to the accepted list of pairs
      if (lastPairedDistance >= minRepeatDistance) {
        let student2 = tempStudentsList.splice(idx, 1)[0]
        pair = addStudentToPair(pair, student2)

        // If the remaining students can't make a pair that hasn't paired recently
        // then restart the pairing process from scratch
      } else if (roundCount > tempStudentsList.length ** 2) {
        pairs = [];
        return await randomizePairs(studentsList, minRepeatDistance)
      }
    }

    // Restart the pairing process if the last student was solo too recently
    if (pair.length === 1) {
      let lastSoloDistance = await lastSolo(pair[0])
      if (lastSoloDistance < minRepeatDistance) {
        pairs = [];
        return await randomizePairs(studentsList, minRepeatDistance)
      }
    }

    pairs.push(pair)
  }
  return pairs;
}

function addStudentToPair(pair, student) {
  if (!pair.student_1) {
    pair.student_1 = student
  } else {
    pair.student_2 = student
  }
  return pair
}

function randomizeListIndex(list) {
  let num = Math.floor(Math.random() * list.length);
  return num
}

async function lastSolo(student) {
  let currentPair = await db.query(`
  SELECT *
  FROM pairs
  ORDER BY group_id DESC
  LIMIT 1`);
  let currentGroup = 0;
  if (currentPair.rows.length > 0) {
    currentGroup = currentPair.rows[0].group_id;
  }

  let result = await db.query(`
  SELECT *
  FROM pairs
  WHERE student1_id = $1 AND student2_id IS NULL
  ORDER BY group_id DESC
  LIMIT 1`, [student.id])
  if (result.rows.length > 0) {
    let lastSoloDistance = currentGroup - result.rows[0].group_id;
    return lastSoloDistance;
  }
  return 10000
}

async function lastPaired(student1, student2) {
  let currentPair = await db.query(`
  SELECT *
  FROM pairs
  ORDER BY group_id DESC
  LIMIT 1`);

  // if no pairs yet populated, don't expect there to be a pair, otherwise compare to most recent pair
  let currentGroup = 0;
  if (currentPair.rows.length > 0) {
    currentGroup = currentPair.rows[0].group_id;
  }

  let result = await db.query(`
  SELECT *
  FROM pairs
  WHERE (student1_id = $1 AND student2_id = $2) 
  OR (student1_id = $2 AND student2_id = $1)
  ORDER BY group_id DESC 
  LIMIT 1
  `, [student1.id, student2.id])
  if (result.rows.length > 0) {
    let lastPaired = currentGroup - result.rows[0].group_id;
    return lastPaired;
  }
  return 10000;
}

async function addStudent({ first_name, last_name, cohort }) {
  let result = await db.query(`
  INSERT INTO students
  (first_name, last_name, cohort)
  VALUES ($1, $2, $3)
  RETURNING first_name, last_name, cohort
  `, [first_name, last_name, cohort]);
  return result.rows[0];
}

async function addCohort(cohort) {
  let result = await db.query(`
    INSERT INTO cohorts
    (cohort_name)
    VALUES ($1)
    RETURNING cohort_name`, [cohort]
  );
  return result.rows[0];
}

async function createListOfStudents(cohort) {
  let result = await db.query(`
    SELECT id, first_name, last_name
    FROM students
    WHERE cohort = $1
    `, [cohort]
  )
  return result.rows;
}

async function acceptPairs(group, project, cohort) {
  console.log(group, project, cohort)
  let groupResult = await db.query(`
    INSERT INTO groups
    (project, cohort)
    VALUES ($1, $2)
    RETURNING id, project, date, cohort
    `, [project, cohort]
  )
  console.log(groupResult.rows)
  for (let pair of group) {
    if (Object.keys(pair).length === 2) {
      await db.query(`
        INSERT INTO pairs
        (student1_id, student2_id, group_id)
        VALUES ($1, $2, $3)
        RETURNING student1_id, student2_id, group_id
      `, [pair.student_1.id, pair.student_2.id, groupResult.rows[0].id])
    } else {
      await db.query(`
        INSERT INTO pairs
        (student1_id, group_id)
        VALUES ($1, $2)
        RETURNING student1_id, group_id
      `, [pair.student_1.id, groupResult.rows[0].id])
    }
  }
  return groupResult.rows;
}

async function getLastPairs(limit, cohort) {
  let result = await db.query(`
    SELECT row_to_json(g) as group
    FROM (
      SELECT id, project, date, cohort, json_agg(json_build_object('student_1', p.student_1, 'student_2', p.student_2)) as pairs
      FROM groups
      LEFT JOIN (
        SELECT row_to_json(s1) as student_1, row_to_json(s2) as student_2, group_id 
        FROM pairs
        LEFT JOIN (SELECT id, first_name, last_name FROM students) as s1
        ON student1_id=s1.id
        LEFT JOIN (SELECT id, first_name, last_name FROM students) as s2
        ON student2_id=s2.id) as p
      ON groups.id=p.group_id
      GROUP BY groups.id
      ORDER BY groups.id DESC
      LIMIT $1
    ) as g
    WHERE cohort = $2
    `, [limit, cohort])
  return result.rows;
}

async function getCohorts() {
  let result = await db.query(`
    SELECT *
    FROM cohorts
  `)
  return result.rows;
}

async function getStudentsFromCohort(cohort) {
  let result = await db.query(`
    SELECT *
    FROM students
    WHERE cohort = $1
    ORDER BY last_name ASC
  `, [cohort])
  return result.rows
}

class User {
  constructor(firstName, lastName, email, username) {
    this.username = username
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
  }

  static async createUser(username, email, password) {
    let hashedPassword = await bcrypt.hash(password, NUM_ROUNDS)
    let result = await db.query(`
    INSERT INTO users
    (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING username, email, password
    `, [username, email, hashedPassword])
    return result.rows
  }

  static async loginUser(username, password) {
    let result = await db.query(`
    SELECT password
    FROM users
    WHERE username = $1`,
      [username]);
    let comparison = await bcrypt.compare(password, result.rows[0].password);
    let token = comparison ? await jwt.sign(username, SECRET_KEY) : null;
    return token;
  }

  static async verifyJwt(req, res, next) {
    try {
      let result = req.body.token ? jwt.verify(req.body.token, SECRET_KEY) : jwt.verify(req.query.token, SECRET_KEY);
      if (result) {
        req.user = result;
        return next()
      }
    } catch (err) {
      return next(err)
    }
  }

  static async getUser(username) {
    let result = await db.query(`
    SELECT *
    FROM users
    WHERE username = $1
    `, [username])
    if (result.rows.length === 1) {
      return result.rows[0]
    } else {
      return ('no user by that name')
    }
  }
}

module.exports = {
  addStudent,
  addCohort,
  randomizePairs,
  acceptPairs,
  createListOfStudents,
  getLastPairs,
  getCohorts,
  getStudentsFromCohort,
  User
}