import { types as _, verifyPassword, GraphQLError, ClientInfo, signBearer } from '@kemsu/graphql-server';
import { jwtSecret } from '../../config';
import AuthTokenType from './AuthTokenType';

export default {
  type: AuthTokenType,
  args: {
    email: { type: _.NonNull(_.String) },
    password: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { email, password }, { db }) {
    const [{ pwdhash, data, picture, passkey, ...user } = {}] = await db.query(`
      SELECT id, role, pwdhash, _data data, (SELECT _value FROM _values WHERE _values.id = picture_value_id) picture, passkey
      FROM users
      LEFT JOIN unverified_accounts ON id = user_id
      WHERE email = ?
    `, email);

    user.complete = data !== null;
    user.verified = passkey === null;
    if (pwdhash !== undefined && verifyPassword(password, pwdhash)) return {
      ...user,
      picture,
      bearer: signBearer(user, jwtSecret)
    };
    throw new GraphQLError("Неверный адрес электронной почты или пароль", ClientInfo.UNMET_CONSTRAINT);
  }
};