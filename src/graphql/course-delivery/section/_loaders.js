import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  fields.id = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_sections ${whereClause}`, params);
}

function byCourseId(courseKeys, { db }, fields) {

  fields.courseId = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ courseKeys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_sections ${whereClause}`, params);
}

export default {
  byId,
  byCourseId
};