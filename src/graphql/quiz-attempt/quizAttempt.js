import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { findUser } from '@lib/authorization';

export default {
  type: _.JSON,
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { userId, db }, { fields }) {
    
    const user = await findUser(userId, db);
    return user.getQuizAttempt(unitId);
  }
} |> upgradeResolveFn;