const db = require('../db');

class Student {

  static async addStudent({ first_name, last_name, cohort }) {
    let result = await db.query(`
    INSERT INTO students
    (first_name, last_name, cohort)
    VALUES ($1, $2, $3)
    RETURNING first_name, last_name, cohort
    `, [first_name, last_name, cohort]);
    return result.rows[0];
  }
  
  static async getStudentsFromCohort(cohort) {
    let result = await db.query(`
      SELECT *
      FROM students
      WHERE cohort = $1
      ORDER BY last_name ASC
    `, [cohort])
    return result.rows
  }
}

module.exports = Student;