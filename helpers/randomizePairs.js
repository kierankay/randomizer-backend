const typeValidation = require('./typeValidators');

/*
This algorithm creates a new group of pairs of students
satisfying the condition that no pair has grouped less than n-groups of pairs ago.

Pairing Algorithm Runtimes - O(n^3)
--------
1. Remap student IDs starting from 0 for efficient use in adjacency matrix
2. Convert edge list into an adjacency matrix weighted by distance to last pairing (O(n))
3. Parse adjacency matrix into adjacency list satisfying min distance to last pairing (O(n))
4. Shuffle the adjacency list O(n)
5. Recursively search for a full list of validPairs from the adjacency matrix O(n^3)
6. Convert student IDs back to old format
*/

function checkTypes(studentsList, edgeList, minRepeatDistance) {
  typeValidation.isArray(studentsList, 'studentsList');
  typeValidation.isArray(edgeList, 'edgeList');
  typeValidation.isNum(minRepeatDistance, 'minRepeatDistance');
}

function createNormIdMaps(studentsList) {
  // Assign students a temporary id from 0 to n, and save the mapping.
  // This enables the use of a more efficient dense adjacency

  const newToOldMap = [];
  const oldToNewMap = [];

  for (let i = 0; i < studentsList.length; i += 1) {
    newToOldMap[i] = studentsList[i];
    oldToNewMap[studentsList[i].id] = i;
  }

  return { newToOldMap, oldToNewMap };
}

function createNormAdjMatrix(studentCount, edgeList, oldToNewMap) {
  // Create an adjacency matrix using zero-indexed students

  // create a new n * n empty adjacency matrix
  const adjMatrix = new Array(studentCount);
  for (let i = 0; i < studentCount; i += 1) {
    adjMatrix[i] = new Array(studentCount);
  }

  // Populate the adjacency matrix at indices according to students'
  // new temporary ids

  edgeList.forEach((edge) => {
    const s1 = oldToNewMap[edge.student1_id];
    const s2 = oldToNewMap[edge.student2_id] || s1; // for solo students
    const weight = edge.group_id;
    if (adjMatrix[s1][s2] === undefined) {
      adjMatrix[s1][s2] = weight;
      adjMatrix[s2][s1] = weight;
    }
  });

  return adjMatrix;
}

async function getRecentGroupId(edgeList) {
  // Get the most recent group number from the list of edges
  // used to ensure only pairings a min distance apart are included in our final list

  const recentGroup = edgeList[0] ? edgeList[0].group_id : null;
  return recentGroup;
}

function createAdjList(adjMatrix, recentGroup, minRepeatDistance) {
  // Compute an adjacency list of the pairs that are more than a min distance apart

  const adjList = new Array(adjMatrix.length);
  for (let i = 0; i < adjMatrix.length; i += 1) {
    adjList[i] = [];
    for (let j = 0; j < adjMatrix[0].length; j += 1) {
      if (adjMatrix[i][j] === undefined || adjMatrix[i][j] <= recentGroup - minRepeatDistance) {
        adjList[i].push(j);
      }
    }
  }
  return adjList;
}

function shuffleAdjList(adjList) {
  const adjListCopy = adjList.slice();
  // Shuffle the adjacency list to introduce randomness.

  for (let i = 0; i < adjListCopy.length; i += 1) {
    for (let j = 0; j < adjListCopy[i].length; j += 1) {
      const randIdx = Math.floor(Math.random() * adjListCopy[i].length);
      const temp = adjListCopy[i][randIdx];
      adjListCopy[i][randIdx] = adjListCopy[i][j];
      adjListCopy[i][j] = temp;
    }
  }
  return adjListCopy;
}

function createPairs(adjList, start = 0, used = new Set(), pairs = []) {
  // Recursively find and return the first complete group of pairs
  // Otherwise return false if it's not possible

  const studentCount = adjList.length;

  if (used.size === studentCount) {
    return pairs;
  }

  for (let student1 = start; student1 < studentCount; student1 += 1) {
    if (used.has(student1)) {
      continue;
    }

    // If we've not found a suitable group after trying all pairs from student1's possible pairs
    // then return false, because no complete groupings are possible.
    if (used.size === 0 && student1 === 1) {
      return false;
    }

    for (let i = 0; i < adjList[student1].length; i += 1) {
      const student2 = adjList[student1][i];
      if (used.has(student2)) {
        continue;
      }

      // If a self-match is found on the adjacency list
      if (student1 === student2) {
        // Then only if there are an odd number of students, or just 1 student left
        // add the solo student to the array of pairs and set of used students
        if ((studentCount - used.size) % 2 === 1 || studentCount === 1) {
          pairs.push([student1, null]);
          used.add(student1);

          // start searching for pairs from the next student's possible pairs
          if (createPairs(adjList, student1 + 1, used, pairs)) {
            return pairs;
          }
          // If we reach the end of of the adjList and the pairs don't include all the students
          // then empty pairs and used and start from the next student match
          pairs.pop();
          used.delete(student1);
        }

        // If two different students are paired on the adjacency list
      } else {
        // Then add them to the array of pairs, and set of used students
        pairs.push([student1, student2]);
        used.add(student1);
        used.add(student2);

        // start searching for pairs from the next student's possible pairs
        if (createPairs(adjList, student1 + 1, used, pairs)) {
          return pairs;
        }
        // If we reach the end of of the adjList and the pairs don't include all the students
        // then empty pairs and used and start from the next student match
        pairs.pop();
        used.delete(student1);
        used.delete(student2);
      }
    }
  }
  return false;
}

function deNormIds(pairs, newToOldMap) {
  // Rebuild pairs's old IDs using a mapping from 0-indexed ids back to old ids
  // use underscored names to match database column names

  const rebuiltPairs = [];
  pairs.forEach((pair) => {
    const mappedStudent1 = newToOldMap[pair[0]];
    const mappedStudent2 = newToOldMap[pair[1]];
    const newPair = {
      student_1: mappedStudent1,
      student_2: mappedStudent2,
    };
    rebuiltPairs.push(newPair);
  });
  return rebuiltPairs;
}

function randomizePairs(studentsList, edgeList, minRepeatDistance) {
  // check inputs are required types
  checkTypes(studentsList, edgeList, minRepeatDistance);

  // Assign students a temporary id from 0 to n.
  // This enables the use of a dense adjacency matrix
  const { newToOldMap, oldToNewMap } = createNormIdMaps(studentsList);

  // create a new n * n adjacency matrix at indices according to students'
  // new temporary ids
  const adjMatrix = createNormAdjMatrix(studentsList.length, edgeList, oldToNewMap);

  // Get the most recent group number from the list of edges
  const recentGroup = getRecentGroupId(edgeList);

  // Compute an adjacency list of the pairs who haven't paired less than n-pairs ago
  const adjList = createAdjList(adjMatrix, recentGroup, minRepeatDistance);

  // Shuffle the adjacency list to introduce randomness.
  const shuffledAdjList = shuffleAdjList(adjList);

  // Find and return the first complete group of pairs
  // Otherwise return false if it's not possible
  const pairs = createPairs(shuffledAdjList);

  // Rebuild the pairs IDs using the first map we created from new to old indexes
  // use underscored names to match database column names
  const rebuiltPairs = deNormIds(pairs, newToOldMap);

  return rebuiltPairs;
}

module.exports = {
  randomizePairs,
};
