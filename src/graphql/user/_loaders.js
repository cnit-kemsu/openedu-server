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

export default {
  byId
};