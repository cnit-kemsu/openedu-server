import { types as _, GraphQLError, dateToString } from '@kemsu/graphql-server';
import { findUser, findUnit } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { userId, db }) {
    const user = await findUser(userId, db);

    if (user.role !== 'student') throw new GraphQLError(`User with role '${this.role}' cannot create quiz attempt. Only users with role 'student' are able to create quiz attempt`);
    if (user.hasQuizAttempt(unitId)) throw new GraphQLError(`Attempt to the quiz has already exist`);

    const unit = await findUnit(unitId, db);
    const subsection = await unit.getSubsection(db);
    if (!user.hasCourseKey(subsection.courseId)) throw new GraphQLError(`You are not enrolled in the course containing the quiz`);
    if (!subsection.isAccessible(db)) throw new GraphQLError(`Access to the subsection containing the quiz has not yet been opened`);
    if (subsection.isExpired(db)) throw new GraphQLError(`Access to the subsection containing the quiz has expired`);

    const startDate = new Date();
    let dataValueId;
    try {
      dataValueId = await db.query(`SELECT create_quiz_attempt(${user.id}, ${unitId}, '${dateToString(startDate)}') dataValueId`)
      |> #[0].dataValueId;
    } catch (error) {
      throw error;
    }

    user.quizAttempts.push({ unitId, dataValueId, startDate: dateToString(startDate), repliesCount: 0 });
    return 1;
  }
};