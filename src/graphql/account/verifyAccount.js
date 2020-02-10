import { types as _, GraphQLError, ClientInfo, signBearer } from '@kemsu/graphql-server';
import { findUser } from '@lib/authorization';
import { jwtSecret } from '../../../config';

export default {
  type: _.NonNull(_.String),
  args: {
    //email: { type: _.String },
    passkey: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { passkey }, { userId, db }) {
    const user = await findUser(userId, db);
    if (user.role !== 'student') throw new GraphQLError(`The role must be equal to 'student'`);

    const [account] = await db.query(`SELECT passkey FROM unverified_accounts WHERE user_id = ${userId}`);
    if (account === undefined) return 0;
    if (account.passkey !== passkey) throw new GraphQLError(
      `Неверный проверочный ключ`,
      ClientInfo.UNMET_CONSTRAINT
    );
    db.query(`DELETE FROM unverified_accounts WHERE user_id = ${userId}`);

    return signBearer({ ...user, verified: true }, jwtSecret);
  }
};