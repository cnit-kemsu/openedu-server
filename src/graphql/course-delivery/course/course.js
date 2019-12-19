import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from './CourseType';
import { sqlBuilder } from './_shared';

export default {
  type: CourseType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {

    const selectExprList = sqlBuilder.buildSelectExprList({ ...fields }, { user });
    const [course] = await db.query(`SELECT ${selectExprList} FROM course_delivery_instances WHERE id = ${id}`);
        
    return course;
  }
} |> upgradeResolveFn;