import { types as _, GraphQLError, ClientInfo, _escape } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { generatePasskey } from '@lib/generatePasskey';
import { sendEmail } from '@lib/sendEmail';
import { sitename, url } from '../../../config';
import RoleInputEnumType from './RoleInputEnumType';

export default {
  type: _.NonNull(_.Int),
  args: {
    role: { type: _.NonNull(RoleInputEnumType) },
    email: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { role, email }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const passkey = generatePasskey(email);
    try {

      const { insertId } = await db.query(`INSERT INTO users (role, email) values ('${role}', ${_escape(email)})`);

      db.query(`INSERT INTO unverified_accounts (user_id, passkey) values (${insertId}, ${_escape(passkey)})`);

      sendEmail(
        email,
        `Регистрация в системе открытого образования ${sitename}`,
        `
          <div>Вы были добавлены в систему открытого образования.</div>
          <div>Проверочный ключ: ${passkey}</div>
          <div>Подтвердите свой аккаунт пройдя по <a href='${url}/account/confirm?email=${JSON.stringify(email) |> encodeURIComponent}'>ссылке</a></div>
        `
      );
      
      return insertId;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Адрес электронный почты '${email}' уже зарегистрирован`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
      
    }
  }
};