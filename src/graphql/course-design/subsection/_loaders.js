import { sqlBuilder } from './_shared';

function byId(keys, { db }, fields) {

  fields.id = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ keys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`, params);
}

function bySectionId(sectionKeys, { db }, fields) {

  fields.sectionId = null;
  const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
  const [whereClause, params] = sqlBuilder.buildWhereClause({ sectionKeys });
  return db.query(`SELECT ${selectExprList} FROM course_design_subsections ${whereClause}`, params);
}

export default {
  byId,
  bySectionId
};