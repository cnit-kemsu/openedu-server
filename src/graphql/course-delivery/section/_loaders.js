import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_sections ${whereClause}`);
}

function byCourseId(courseKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, courseId: null });
  const whereClause = sqlBuilder.buildWhereClause({ courseKeys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_sections ${whereClause}`);
}

export default {
  byId,
  byCourseId
};