import { types as _ } from '@kemsu/graphql-server';
import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {
  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM users ${whereClause}`);
}

function instructor_byCourseId(courseKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList(fields);
  return db.query(`
    SELECT ${selectExprList}, course_id courseId FROM users
    JOIN instructor_assignments ON id = user_id
    WHERE course_id IN (${courseKeys.join(', ')})
  `);
}

function student_byCourseId(courseKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList(fields);
  return db.query(`
    SELECT ${selectExprList}, course_id courseId FROM users
    JOIN (
      SELECT user_id, course_id FROM free_course_enrollments
      UNION ALL
      SELECT user_id, course_id FROM paid_course_purchases WHERE callback_status='success'
    ) ON id = user_id
    WHERE course_id IN (${courseKeys.join(', ')})
  `);
}

export default {
  byId,
  instructor_byCourseId,
  student_byCourseId
};