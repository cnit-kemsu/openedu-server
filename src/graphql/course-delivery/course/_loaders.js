import { sqlBuilder } from './_shared';

async function byId(keys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({...fields, id: null });
  const whereClause = await sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_delivery_instances ${whereClause}`);
}

export default {
  byId
};