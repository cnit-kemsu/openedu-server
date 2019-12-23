import { types as _, GraphQLError } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { db, user }) {
    const _user = await verifySignedIn(user);
    await _user.verifyCanCreateQuizAttempt(unitId);

    try {

      await db.query(`CALL create_quiz_attempt(${user.id}, ${unitId})`);

    } catch (error) {

      if (error.rootCause?.message === 'invalid role') throw new GraphQLError(`User with role '${user.role}' cannot create quiz attempt. Only users with role 'student' are able to create quiz attempt`);
      if (error.rootCause?.message === 'not enrolled') throw new GraphQLError("You are not enrolled in the course containing the quiz");
      if (error.rootCause?.message === 'access closed') throw new GraphQLError("Access to the subsection containing the quiz has not yet been opened");
      if (error.rootCause?.message === 'access expired') throw new GraphQLError("Access to the subsection containing the quiz has expired");

      throw error;
      
    } finally {
      _user.quizAttempts.push({  });
    }

    return 1;
  }
};