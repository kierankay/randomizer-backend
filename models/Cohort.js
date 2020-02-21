const db = require('../db');

class Cohort {
  static async getCohorts(orgId) {
    try {
      const result = await db.query(`
      SELECT *
      FROM cohorts
      WHERE organization_id = $1
    `, [orgId]);
      return result.rows;
    } catch (err) {
      throw new Error(err.detail);
    }
  }

  static async addCohort(cohort, orgId) {
    try {
      const result = await db.query(`
      INSERT INTO cohorts
      (cohort_name, organization_id)
      VALUES ($1, $2)
      RETURNING id, cohort_name`, [cohort, orgId]);
      return result.rows[0];
    } catch (err) {
      throw new Error(err.detail);
    }
  }
}

module.exports = Cohort;
