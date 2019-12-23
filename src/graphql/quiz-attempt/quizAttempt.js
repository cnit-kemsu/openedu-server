import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.JSON,
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { user, db }, { fields }) {
    
    const _user = await verifySignedIn(user);
    return _user.getQuizAttempt(unitId);
  }
} |> upgradeResolveFn;