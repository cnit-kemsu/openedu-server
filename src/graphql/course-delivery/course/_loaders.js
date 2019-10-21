import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_instances ${whereClause}`, params);
}

export default {
  byId
};