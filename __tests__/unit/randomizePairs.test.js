const { randomizePairs } = require('../../helpers/randomizePairs');

const studentsList = [
  {
    id: 4,
    first_name: 'Kieran',
    last_name: 'Kay',
    cohort_id: 2,
  },
  {
    id: 5,
    first_name: 'Elizabeth',
    last_name: 'Wang',
    cohort_id: 2,
  },
  {
    id: 6,
    first_name: 'Johnny',
    last_name: 'Depp',
    cohort_id: 2,
  },
  {
    id: 7,
    first_name: 'Aylin',
    last_name: 'Zafar',
    cohort_id: 2,
  },
  {
    id: 8,
    first_name: 'Tarron',
    last_name: 'Kay',
    cohort_id: 2,
  },
];

const edgeList = [
  { student1_id: 4, student2_id: 5, group_id: 3 },
  { student1_id: 6, student2_id: 7, group_id: 3 },
  { student1_id: 8, student2_id: null, group_id: 3 },
  { student1_id: 8, student2_id: 7, group_id: 2 },
  { student1_id: 6, student2_id: 5, group_id: 2 },
  { student1_id: 4, student2_id: null, group_id: 2 }
];

const minRepeatDistance = 2;

describe('randomizing pairs of students from a cohort', () => {
  test('odd sized cohort (5) with possible repeat distance (1)', () => {
    expect(randomizePairs(studentsList, edgeList, minRepeatDistance).length).toBe(3);
  });
  test('even sized cohort (4) with possible repeat distance (1)', () => {
    expect(randomizePairs(studentsList, edgeList, minRepeatDistance).length).toBe(3);
  })
})

// create tests for inner functions
