import { types as _ } from '@kemsu/graphql-server';
import { verifyInstructorRole, findLocalUser } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    unitId: { type: _.NonNull(_.Int) },
    userId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { userId: _userId, unitId }, { userId, db }) {
    await verifyInstructorRole(userId, db);

    const { affectedRows } = await db.query(`DELETE FROM quiz_attempts WHERE user_id = ${_userId} AND unit_id = ${unitId}`);
    const user = findLocalUser(_userId);
    if (user?.constructor === Promise) await user;
    if (user) user.deleteQuizAttempt(unitId);

    return affectedRows;
  }
};