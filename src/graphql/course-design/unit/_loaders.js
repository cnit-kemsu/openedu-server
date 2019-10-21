import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  fields.id = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`, params);
}

function bySubsectionId(subsectionKeys, { db }, fields) {

  fields.subsectionId = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ subsectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_units ${whereClause}`, params);
}

export default {
  byId,
  bySubsectionId
};