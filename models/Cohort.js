const db = require('../db');

class Cohort {

  static async getCohorts(orgId) {
    let result = await db.query(`
      SELECT *
      FROM cohorts
      WHERE organization_id = $1
    `, [orgId])
    return result.rows;
  }
  
  static async addCohort(cohort, orgId) {
    let result = await db.query(`
      INSERT INTO cohorts
      (cohort_name, organization_id)
      VALUES ($1, $2)
      RETURNING id, cohort_name`, [cohort, orgId]
    );
    return result.rows[0];
  }
}

module.exports = Cohort;