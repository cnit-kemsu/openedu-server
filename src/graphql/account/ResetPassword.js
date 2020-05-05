import { types as _, GraphQLError, ClientInfo, hashPassword, signBearer, _escape } from '@kemsu/graphql-server';
import { jwtSecret } from '../../../config';
import AuthTokenType from './AuthTokenType';

export default {
  type: AuthTokenType,
  args: {
    password: { type: _.NonNull(_.String) },
    passkey: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { password, passkey }, { db }) {

    const [{ email, picture, ...user } = {}] = await db.query(`
      SELECT id, role, email, (SELECT _value FROM _values WHERE _values.id = picture_value_id) picture
      FROM users
      WHERE pwdreset_token = ${_escape(passkey)}
    `);
    
    if (!user?.id) throw new GraphQLError(
      `Неверный проверочный ключ`,
      ClientInfo.UNMET_CONSTRAINT
    );

    await db.query(`
      UPDATE users
      SET pwdhash = ${hashPassword(password)|> _escape}, pwdreset_token = NULL
      WHERE id = ${user.id}
    `);

    return {
      ...user,
      email,
      picture,
      bearer: signBearer({ ...user, verified: true, complete: true }, jwtSecret)
    };
  }
};