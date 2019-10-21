import { types as _, GraphQLError, ClientInfo, hashPassword, signBearer } from '@kemsu/graphql-server';
import { jwtSecret } from '../../config';

export default {
  type: _.NonNull(_.String),
  args: {
    email: { type: _.NonNull(_.String) },
    password: { type: _.NonNull(_.String) },
    passkey: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { email, password, passkey }, { db }) {

    const [{ accountPasskey, ...user } = {}] = await db.query(`
      SELECT id, role, passkey accountPasskey
      FROM users
      RIGHT JOIN unverified_accounts ON id = user_id
      WHERE email = ?
    `, email);
    if (accountPasskey === undefined) return 0;
    if (accountPasskey !== passkey) throw new GraphQLError(
      'Неверный проверочный ключ',
      ClientInfo.UNMET_CONSTRAINT
    );
    db.query(`UPDATE users SET pwdhash = ? WHERE id = ?`, [hashPassword(password), user.id]);
    db.query(`DELETE FROM unverified_accounts WHERE user_id = ?`, user.id);
    
    return signBearer({ ...user, verified: true, complete: false }, jwtSecret);
  }
};