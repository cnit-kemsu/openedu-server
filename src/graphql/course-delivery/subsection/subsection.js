import { types as _, upgradeResolveFn, GraphQLError } from '@kemsu/graphql-server';
import { findUser, findSubsection } from '@lib/authorization';
import SubsectionType from './SubsectionType';
import { sqlBuilder } from './_shared';

export default {
  type: SubsectionType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }, { fields }) {

    const user = await findUser(userId, db);
    if (user.role !== 'superuser' && user.role !== 'admin') {

      const subsection = await findSubsection(id);
      if (!user.hasCourseKey(subsection.courseId)) {
        if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the subsection`);
        else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the subsection`);
      }
      if (this.role === 'student' && !subsection.isAccessible) throw new GraphQLError(`Access to the subsection has not yet been opened`);
    }

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_subsections WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;