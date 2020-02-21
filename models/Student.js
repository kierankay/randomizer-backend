const db = require('../db');

class Student {
  /*
    Add a new student to a cohort
    inputs: "Kieran", "Kay", 1
    output: {
      first_name: "Kieran",
      last_name: "Kay",
      cohort_id: 1
    }
  */

  static async addStudent(student) {
    const { first_name, last_name, cohort } = student;
    try {
      const result = await db.query(`
    INSERT INTO students
    (first_name, last_name, cohort_id)
    VALUES ($1, $2, $3)
    RETURNING first_name, last_name, cohort_id
    `, [first_name, last_name, cohort]);
      return result.rows[0];
    } catch (err) {
      throw new Error(err.detail);
    }
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
    try {
      const result = await db.query(`
      SELECT *
      FROM students
      WHERE cohort_id = $1
      ORDER BY last_name ASC
    `, [cohort]);
      return result.rows;
    } catch (err) {
      throw new Error(err.detail);
    }
  }
}

module.exports = Student;
