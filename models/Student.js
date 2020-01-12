const db = require('../db');

class Student {

  static async addStudent({ first_name, last_name, cohort }) {
    let result = await db.query(`
    INSERT INTO students
    (first_name, last_name, cohort_id)
    VALUES ($1, $2, $3)
    RETURNING first_name, last_name, cohort_id
    `, [first_name, last_name, cohort]);
    return result.rows[0];
  }

  /*
    Fetch all students from a cohort
    input: 1
    output: [
      {
        id: 1,
        first_name: Kieran,
        last_name: Kay,
        cohort_id: 1
      },
      ...
    ]
*/

  static async getStudentsFromCohort(cohort) {
    let result = await db.query(`
      SELECT *
      FROM students
      WHERE cohort_id = $1
      ORDER BY last_name ASC
    `, [cohort])
    return result.rows
  }
}

module.exports = Student;