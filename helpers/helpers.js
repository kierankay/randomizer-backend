const db = require('../db');

// Function to generate randomized pairs
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

module.exports = {
  randomizePairs
}