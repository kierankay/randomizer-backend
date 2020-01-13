const Pair = require('../models/Pair');

/*
Pairing Algorithm Runtimes - O(n^3)
--------
1. Parse edge list from database into memory O(n)
2. Convert edge list into an adjacency matrix weighted by distance to last pairing (O(n))
3. Parse adjacency matrix into adjacency list satisfying min distance to last pairing (O(n))
4. Shuffle the adjacency list O(n)
5. Recursively search for a full list of validPairs from the adjacency matrix O(n^3)
*/

async function randomizePairs(studentsList, minRepeatDistance, cohort) {
  let { newToOldMap, oldToNewMap } = createNormalizedIdMaps(studentsList);
  let edgeList = await Pair.getPairsEdgeList(minRepeatDistance, cohort);
  let adjMatrix = createAdjMatrix(studentsList.length, edgeList, oldToNewMap);
  let recentGroup = getRecentGroupId(cohort);
  let adjList = createAdjList(adjMatrix, recentGroup, minRepeatDistance);
  let shuffledAdjList = shuffleAdjList(adjList);
  let pairs = createPairs(shuffledAdjList, studentsList.length);
  let rebuiltPairs = deNormalizeIds(pairs, newToOldMap);
  return rebuiltPairs;
}

function createNormalizedIdMaps(studentsList) {

  // Give students a temporary id from 0 to n. This enables the use of a dense
  // adjacency matrix

  let newToOldMap = [];
  let oldToNewMap = [];

  for (let i = 0; i < studentsList.length; i++) {
    newToOldMap[i] = studentsList[i];
    oldToNewMap[studentsList[i].id] = i;
  }

  return { newToOldMap, oldToNewMap }
}

function createAdjMatrix(studentCount, edgeList, oldToNewMap) {

  // create a new n * n empty adjacency matrix

  let adjMatrix = new Array(studentCount);
  for (let i = 0; i < studentCount; i++) {
    adjMatrix[i] = new Array(studentCount);
  }

  // Fetch minRepeatDistance past pairs from the cohort
  // and populate the adjacency matrix at indices according to students' 
  // temporary ids

  for (let edge of edgeList) {
    let s1 = oldToNewMap[edge.student1_id];
    let s2 = oldToNewMap[edge.student2_id] || s1; // for solo students
    let weight = edge.group_id;
    if (adjMatrix[s1][s2] === undefined) {
      adjMatrix[s1][s2] = weight;
      adjMatrix[s2][s1] = weight;
    }
  }
  return adjMatrix;
}

async function getRecentGroupId(edgeList) {
  let recentGroup = edgeList[0] ? edgeList[0].group_id : null;
  return recentGroup;
}

function createAdjList(adjMatrix, recentGroup, minRepeatDistance) {

  // Compute an adjacency list of the possible pairs given the minPairDistance.
  // Clear this whenever new pairs are created.

  let adjList = new Array(adjMatrix.length);
  for (let i = 0; i < adjMatrix.length; i++) {
    adjList[i] = [];
    for (let j = 0; j < adjMatrix[0].length; j++) {
      if (adjMatrix[i][j] === undefined || adjMatrix[i][j] <= recentGroup - minRepeatDistance) {
        adjList[i].push(j);
      }
    }
  }
  return adjList;
}

function shuffleAdjList(adjList) {

  // Shuffle the adjacency list to introduce randomness.

  for (let i = 0; i < adjList.length; i++) {
    for (let j = 0; j < adjList[i].length; j++) {
      let randIdx = Math.floor(Math.random() * adjList[i].length);
      let temp = adjList[i][randIdx];
      adjList[i][randIdx] = adjList[i][j];
      adjList[i][j] = temp;
    }
  }
  return adjList;
}

function createPairs(adjList, studentCount, start = 0, used = new Set(), pairs = []) {

  // Recursively find and return the first valid pair
  // INPUTS: list of students, pairs, set of used students

  if (used.size === studentCount) {
    return pairs;
  }

  for (let i = start; i < adjList.length; i++) {
    if (!used.has(i)) {
      for (let j = 0; j < adjList[i].length; j++) {
        if (!used.has(adjList[i][j])) {
          if (i === adjList[i][j]) {
            if ((studentCount - used.size) % 2 === 1 || studentCount === 1) {
              pairs.push([i]);
              used.add(i);
              if (createPairs(adjList, studentCount, i + 1, used, pairs)) {
                return pairs;
              } else {
                pairs.pop();
                used.delete(i);
              }
            }
          } else {
            pairs.push([i, adjList[i][j]]);
            used.add(i)
            used.add(adjList[i][j]);
            if (createPairs(adjList, studentCount, i + 1, used, pairs)) {
              return pairs;
            } else {
              pairs.pop();
              used.delete(i)
              used.delete(adjList[i][j]);
            }
          }
        }
      }
    }
  }
  return false;
}

function deNormalizeIds(pairs, newToOldMap) {

    // Rebuild the pairs using the first map we created from new to old indexes
    
    let rebuiltPairs = [];
    for (let pair of pairs) {
      let mappedStudent1 = newToOldMap[pair[0]];
      let mappedStudent2 = newToOldMap[pair[1]];
      let newPair = {
        student_1: mappedStudent1,
        student_2: mappedStudent2
      };
      rebuiltPairs.push(newPair);
    }
    return rebuiltPairs;
}

module.exports = {
  randomizePairs,
  createNormalizedIdMaps,
  createAdjMatrix,
  getRecentGroupId,
  createAdjList,
  shuffleAdjList,
  createPairs,
  deNormalizeIds
}