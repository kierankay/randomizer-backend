const db = require('../db');

class Pair {

  static async acceptPairs(group, project, cohort) {
    let groupResult = await db.query(`
      INSERT INTO groups
      (project, cohort_id)
      VALUES ($1, $2)
      RETURNING id, project, date, cohort_id
      `, [project, cohort]
    )
    for (let pair of group) {
      if (Object.keys(pair).length === 2) {
        await db.query(`
          INSERT INTO pairs
          (student1_id, student2_id, group_id)
          VALUES ($1, $2, $3)
          RETURNING student1_id, student2_id, group_id
        `, [pair.student_1.id, pair.student_2.id, groupResult.rows[0].id])
      } else {
        await db.query(`
          INSERT INTO pairs
          (student1_id, group_id)
          VALUES ($1, $2)
          RETURNING student1_id, group_id
        `, [pair.student_1.id, groupResult.rows[0].id])
      }
    }
    return groupResult.rows;
  }


  /*
  Return grouped pairs with metadata.
  Ex: [
    {
      "group": {
        "id": 1,
        "project": "New Project",
        "date": "2019-11-05",
        "cohort_id": 1,
        "pairs": [
          {
            "student_1": {
              "id": 1,
              "first_name": "Kieran",
              "last_name": "Kay"
            },
            "student_2": null
          }
        ]
      }
    }
  ]
  */

  static async getLastPairs(limit, cohort) {
    let result = await db.query(`
      SELECT row_to_json(g) as group
      FROM (
        SELECT id, project, date, cohort_id, json_agg(json_build_object('student_1', p.student_1, 'student_2', p.student_2)) as pairs
        FROM groups
        LEFT JOIN (
          SELECT row_to_json(s1) as student_1, row_to_json(s2) as student_2, group_id 
          FROM pairs
          LEFT JOIN (SELECT id, first_name, last_name FROM students) as s1
          ON student1_id=s1.id
          LEFT JOIN (SELECT id, first_name, last_name FROM students) as s2
          ON student2_id=s2.id) as p
        ON groups.id=p.group_id
        GROUP BY groups.id
        ORDER BY groups.id DESC
        LIMIT $1
      ) as g
      WHERE cohort_id = $2
      `, [limit, cohort])
    return result.rows;
  }

  /* 
  Return pairs as weighted edge list.
  Ex: [[1, 2, 1],[3, 4, 1], ...]
  */

  static async getPairsEdgeList(limit, cohort) {
    let result = await db.query(`
      SELECT pairs.student1_id, pairs.student2_id, pairs.group_id
      FROM pairs
      LEFT JOIN groups ON pairs.group_id = groups.id
      WHERE groups.cohort_id = $2
      AND pairs.group_id > (SELECT group_id FROM pairs ORDER BY group_id DESC LIMIT 1) - $1
      ORDER BY pairs.group_id DESC
      `, [limit, cohort]);
    return result.rows;
  }
}

module.exports = Pair;