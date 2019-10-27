const db = require('../db');

class Cohort {

  static async getCohorts() {
    let result = await db.query(`
      SELECT *
      FROM cohorts
    `)
    return result.rows;
  }
  
  static async addCohort(cohort) {
    let result = await db.query(`
      INSERT INTO cohorts
      (cohort_name)
      VALUES ($1)
      RETURNING cohort_name`, [cohort]
    );
    return result.rows[0];
  }
}

module.exports = Cohort;