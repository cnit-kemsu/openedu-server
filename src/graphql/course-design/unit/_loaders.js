import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, id: null });
  const whereClause = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`);
}

function bySubsectionId(subsectionKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields, subsectionId: null });
  const whereClause = sqlBuilder.buildWhereClause({ subsectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`);
}

export default {
  byId,
  bySubsectionId
};