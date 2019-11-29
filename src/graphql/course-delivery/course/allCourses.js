import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from './CourseType';
import { sqlBuilder, searchArgs } from './_shared';

export default {
  type: _.List(CourseType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    availableToEnroll: { type: _.Boolean },
    ...searchArgs,
    onlyEnrolled: { type: _.Boolean }
  },
  async resolve(obj, { limit = 10, offset = 0, availableToEnroll, onlyEnrolled, ...search }, { user, db }, { fields }) {

    const extraFilter = ['defunct = 0'];
    if (onlyEnrolled && user) extraFilter.push(
      user.role === 'student'
      ? `id IN (SELECT course_id FROM free_course_enrollments WHERE user_id = ${user.id} UNION ALL SELECT course_id FROM paid_course_purchases WHERE user_id = ${user.id})`
      : `id IN (SELECT course_id FROM instructor_assignments WHERE user_id = ${user.id})`
    );
    if (availableToEnroll) extraFilter.push('(enrollment_end_date > NOW() OR enrollment_end_date IS NULL)');
    const [selectExprList, params1] = sqlBuilder.buildSelectExprList(fields, { userId: user?.id });
    const [whereClause, params2] = sqlBuilder.buildWhereClause(search, extraFilter);
    try {
      const res = await db.query(`SELECT ${selectExprList} FROM course_delivery_instances ${whereClause} LIMIT ? OFFSET ?`, [...params1, ...params2, limit, offset]);
      return res;
    }
    catch (error) {
      throw error;
    }
  }
} |> upgradeResolveFn;