import { sqlBuilder } from './_shared';

async function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = await sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`);
}

async function bySubsectionId(subsectionKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, subsectionId: null });
  const whereClause = await sqlBuilder.buildWhereClause({ subsectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`);
}

export default {
  byId,
  bySubsectionId
};