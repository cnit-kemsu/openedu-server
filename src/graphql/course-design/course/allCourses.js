import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import CourseType from './CourseType';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.List(CourseType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  async resolve(obj, { limit = 10, offset = 0, ...search }, { user, db }, { fields }) {
    await verifyAdminRole(user, db);

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    const [whereClause, params] = sqlBuilder.buildWhereClause(search, ['defunct = 0']);
    try {
      const res = await db.query(`SELECT ${selectExprList} FROM course_design_templates ${whereClause} LIMIT ? OFFSET ?`, [...params, limit, offset]);
      return res;
    }
    catch (error) {
      throw error;
    }
  }
} |> upgradeResolveFn;