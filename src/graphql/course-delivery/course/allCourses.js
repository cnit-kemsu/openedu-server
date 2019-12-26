import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from './CourseType';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.List(CourseType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs,
  },
  async resolve(obj, { limit = 10, offset = 0, ...search }, { userId, db }, { fields }) {

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    const whereClause = await sqlBuilder.buildWhereClause(search, null, { userId, db });
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_instances ${whereClause} LIMIT ${limit} OFFSET ${offset}`);
  }
} |> upgradeResolveFn;