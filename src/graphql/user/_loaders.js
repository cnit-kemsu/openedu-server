import { types as _ } from '@kemsu/graphql-server';
import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {
  fields.id = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ keys });
  return db.query(
    `SELECT ${selectExprList} FROM users ${whereClause}`,
    params
  );
}

function instructors_byCourseId(courseKeys, { db }, fields) {

  const selectExprList = sqlBuilder.buildSelectExprList({ ...fields });
  const whereClause = sqlBuilder.buildWhereClause({ courseKeys });
  return db.query(`SELECT ${selectExprList} FROM users ${whereClause} WHERE id IN ()`);
}

export default {
  byId,
  instructors_byCourseId
};