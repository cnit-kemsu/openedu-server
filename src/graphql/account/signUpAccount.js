import { types as _, hashPassword, signBearer, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { generatePasskey } from '@lib/generatePasskey';
import { sendEmail } from '../../sendEmail';
import { jwtSecret, sitename } from '../../config';

export default {
  type: _.NonNull(_.String),
  args: {
    email: { type: _.NonNull(_.String) },
    password: { type: _.NonNull(_.String) },
    firstname: { type: _.NonNull(_.String) },
    lastname: { type: _.NonNull(_.String) },
    middlename: { type: _.String }
  },
  async resolve(obj, { email, password, firstname, lastname, middlename }, { db }) {

    const data = { firstname, lastname, middlename };
    const passkey = generatePasskey(email);
    try {

      const { insertId: userId } = await db.query(
        `INSERT INTO users (role, email, pwdhash, _data) values ('student', ?, ?, ?)`,
        [email, hashPassword(password), JSON.stringify(data)]
      );

      db.query(`INSERT INTO unverified_accounts (user_id, passkey) values (?, ?)`, [userId, passkey]);

      sendEmail(
        email,
        `Регистрация в системе открытого образования ${sitename}`,
        `
          <div>Вы были зарегистрированы в системе открытого образования.</div>
          <div>Проверочный ключ: ${passkey}</div>
        `
      );
      
      return signBearer({ id: userId, role: 'student', email, verified: false, complete: true }, jwtSecret);

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Адрес электронный почты '${email}' уже зарегистрирован`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};