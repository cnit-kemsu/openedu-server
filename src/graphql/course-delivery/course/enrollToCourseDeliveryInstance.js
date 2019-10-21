import { types as _, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { verifyUserRole } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { db, user }) {
    const role = await verifyUserRole(user, db);
    if (role !== 'student') throw new GraphQLError("Only students can enroll to course", ClientInfo.UNMET_CONSTRAINT);

    try {

      await db.query(`CALL enroll_user_in_free_course(?, ?)`, [user.id, courseId]);
      return 1;

    } catch(error) {

      if (error.rootCause?.message === 'PAID_COURSE') throw new GraphQLError(`You must pay first`, ClientInfo.UNMET_CONSTRAINT);
      //if (error.rootCause?.message === 'NOT_STARTED') throw new GraphQLError(`Course not started`, ClientInfo.UNMET_CONSTRAINT);
      if (error.rootCause?.message === 'ENROLLMENT_EXPIRED') throw new GraphQLError(`Course enrollment expired`, ClientInfo.UNMET_CONSTRAINT);
      if (error.rootCause?.message.substring(0, 15) === 'Duplicate entry') throw new GraphQLError(
        `You are already enrolled`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
      
    }
    
  }
};