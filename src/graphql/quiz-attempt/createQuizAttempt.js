import { types as _, GraphQLError, dateToString } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { db, user }) {
    const _user = await verifySignedIn(user);
    await _user.verifyCanCreateQuizAttempt(unitId);

    const startDate = new Date();
    let dataValueId;

    try {

      dataValueId = await db.query(`SELECT create_quiz_attempt(${user.id}, ${unitId}, ${dateToString(startDate)}) dataValueId`)
      |> #[0].dataValueId;

    } catch (error) {
      throw error;
    }

    _user.quizAttempts.push({ unitId, dataValueId, startDate, repliesCount: 0 });
    return 1;
  }
};