import { types as _, upgradeResolveFn, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
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
    let subsection;
    if (user.role !== 'superuser' && user.role !== 'admin') {

      subsection = await findSubsection(id);
      if (!user.hasCourseKey(subsection.courseId)) {
        if (user.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the subsection`, ClientInfo.UNMET_CONSTRAINT);
        else if (user.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the subsection`, ClientInfo.UNMET_CONSTRAINT);
      }
      if (user.role === 'student' && !subsection.isAccessible()) throw new GraphQLError(`Access to the subsection has not yet been opened`, ClientInfo.UNMET_CONSTRAINT);

      delete fields.id;
      delete fields.sectionId;
      delete fields.section;
      delete fields.units;
      delete fields.accessDate;
      delete fields.expirationDate;
    }
    
    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    if (selectExprList === '*') return { id };
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_subsections WHERE id = ${id}`)
    |> {
      ...subsection.props,
      ...#[0]
    };
  }
} |> upgradeResolveFn;