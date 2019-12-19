import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList(fields);
  const whereClause = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_templates ${whereClause}`);
}

export default {
  byId
};