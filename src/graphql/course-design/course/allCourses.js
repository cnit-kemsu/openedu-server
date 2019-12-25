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
  async resolve(obj, { limit = 10, offset = 0, ...search }, { userId, db }, { fields }) {
    await verifyAdminRole(userId, db);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    const whereClause = await sqlBuilder.buildWhereClause(search, ['defunct = FALSE']);
    try {
      return await db.query(`SELECT ${selectExprList} FROM course_design_templates ${whereClause} LIMIT ${limit} OFFSET ${offset}`);
    }
    catch (error) {
      throw error;
    }
  }
} |> upgradeResolveFn;