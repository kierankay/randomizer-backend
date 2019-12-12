const db = require('../db');
const Pair = require('../models/Pair');

/*
Pairing Algorithm: 

Runtimes
--------
Total theoretical runtime O(n^3)
Parse edge list in database into adjacency matrix weighted by distance to last pairing (O(n) runtime)
Parse adjacency matrix into adjacency list satisfying min distance to last pairing (O(n) runtime)
Recursively compute validPairs from adjacency matrix O(n^3)

Algorithms
--------
Parse edge list into adjacency matrix
Parse adjacency matrix into min-distance-filtered adjacency list
Shuffle adjacent vertices order to eliminate first-discovery in ordered-data bias
Recursively compute valid pairs
  Establish base case
    if used.length === students.length return pairs;
  loop starting at startIdx
    If student index not in used
      loop starting at 0
        If adjacent student not in used
          If index === adjacent 
            if students.length - used.size % 2 === 1)
              create pair (pairs.push(), used.add(idx, adjacent))
              if (createPairFromNext(i+1)) return true;
              else (pairs.pop(), used.delete(idx, adjacent))
          Else 
            create pair (pairs.push(), used.add(idx, adjacent))
            if (createPairFromNext(i+1)) return true;
            else (pairs.pop(), used.delete(idx, adjacent));
    return false;
*/

async function randomizePairs(studentsList, minRepeatDistance, cohort) {

  // REINDEX STUDENT_IDS TO 0-N
  // TO MINIMIZE MATRIX DIMENSIONS
  let newToOldMap = [];
  let oldToNewMap = [];
  for (let i = 0; i < studentsList.length; i++) {
    newToOldMap[i] = studentsList[i];
    oldToNewMap[studentsList[i].id] = i;
  }

  // CREATE A NEW ADJACENCY MATRIX OF N * N DIMENSIONS

  let edges = await Pair.getPairsEdgeList(minRepeatDistance, cohort);
  let recentGroup = edges[0] ? edges[0].group_id : null;
  let studentCount = studentsList.length;
  let adjMatrix = new Array(studentCount);
  for (let i = 0; i < studentCount; i++) {
    adjMatrix[i] = new Array(studentCount);
  }

  // POPULATE THE ADJACENCY MATRIX USING NEW INDICES
  
  for (let edge of edges) {
    let s1 = oldToNewMap[edge.student1_id];
    let s2 = oldToNewMap[edge.student2_id] || s1;
    let weight = edge.group_id;
    if (adjMatrix[s1][s2] === undefined) {
      adjMatrix[s1][s2] = weight;
      adjMatrix[s2][s1] = weight;
    }
  }

  // COMPUTE ADJACENCY LIST GIVEN MIN PAIR DISTANCE
  // CLEAR WHEN NEW PAIRS CREATED
  let adjList = new Array(adjMatrix.length);

  for (let i = 0; i < adjMatrix.length; i++) {
    adjList[i] = [];
    for (let j = 0; j < adjMatrix[0].length; j++) {
      if (adjMatrix[i][j] === undefined || adjMatrix[i][j] <= recentGroup - minRepeatDistance) {
        adjList[i].push(j);
      }
    }
  }

  // SHUFFLE AdjList to introduce randomness

  for (let i = 0; i < adjList.length; i++) {
    for (let j = 0; j < adjList[i].length; j++) {
      let randIdx = Math.floor(Math.random()*adjList[i].length);
      let temp = adjList[i][randIdx];
      adjList[i][randIdx] = adjList[i][j];
      adjList[i][j] = temp;
    }
  }

  // FIND AND RETURN FIRST QUALIFYING PAIR USING RECURSION
  // INPUTS: list of students, pairs, set of used students
  // OUTPUTS: 

  let used = new Set();
  let pairs = [];

  function createPairs(start) {
    if (used.size === studentCount) {
      return true;
    }
    for (let i = start; i < adjList.length; i++) {
      if (!used.has(i)) {
        for (let j = 0; j < adjList[i].length; j++) {
          if (!used.has(adjList[i][j])) {
            if (i === adjList[i][j]) {
              if ((studentCount - used) % 2 === 1 || studentCount === 1) {
                pairs.push([i]);
                used.add(i);
                if (createPairs(i + 1)) {
                  return true;
                } else {
                  pairs.pop();
                  used.delete(i);
                }
              }
            } else {
              pairs.push([i, adjList[i][j]]);
              used.add(i) 
              used.add(adjList[i][j]);
              if (createPairs(i + 1)) {
                return true;
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
  }
  createPairs(0);
  
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
  randomizePairs
}