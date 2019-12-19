import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`);
}

function bySectionId(sectionKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, sectionId: null });
  const whereClause = sqlBuilder.buildWhereClause({ sectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`);
}

export default {
  byId,
  bySectionId
};