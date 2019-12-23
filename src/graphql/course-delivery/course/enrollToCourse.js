import { types as _, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { db, user }) {
    const _user = await verifySignedIn(user);
    await _user.verifyCanEnrollToCourse(courseId);

    try {

      await db.query(`CALL enroll_user_in_free_course(${user.id}, ${courseId})`);

    } catch(error) {

      // if (error.rootCause?.message.substring(0, 15) === 'Duplicate entry') throw new GraphQLError(
      //   `You are already enrolled`,
      //   ClientInfo.UNMET_CONSTRAINT
      // );
      throw error;
      
    } finally {
      _user.courseKeys.push(courseId);
    }

    return 1;
    
  }
};