import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from './CourseType';
import { sqlBuilder } from './_shared';

export default {
  type: CourseType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {

    const [selectExprList, params] = sqlBuilder.buildSelectExprList(fields, { userId: user?.id });
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_instances WHERE id = ?`, [...params, id])
    |> #[0];
  }
} |> upgradeResolveFn;