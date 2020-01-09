import { sqlBuilder } from './_shared';

async function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = await sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_sections ${whereClause}`);
}

async function byCourseId(courseKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, courseId: null });
  const whereClause = await sqlBuilder.buildWhereClause({ courseKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_sections ${whereClause}`);
}

export default {
  byId,
  byCourseId
};