import { sqlBuilder } from './_shared';

async function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = await sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`);
}

async function bySectionId(sectionKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, sectionId: null });
  const whereClause = await sqlBuilder.buildWhereClause({ sectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`);
}

export default {
  byId,
  bySectionId
};