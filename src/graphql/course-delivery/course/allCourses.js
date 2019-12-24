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
  async resolve(obj, { limit = 10, offset = 0, ...search }, { user, db }, { fields }) {

    const selectExprList = sqlBuilder.buildSelectExprList(fields, { user, enrolledFilterPassed: search.currentUserEnrolled === true });
    const whereClause = sqlBuilder.buildWhereClause(search, ['defunct = 0'], { user });
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_instances ${whereClause} LIMIT ${limit} OFFSET ${offset}`);
  }
} |> upgradeResolveFn;