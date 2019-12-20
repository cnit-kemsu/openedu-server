import { types as _, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { generatePasskey } from '@lib/generatePasskey';
import { sendEmail } from '@lib/sendEmail';
import { sitename, url } from '../../config';
import RoleInputEnumType from './RoleInputEnumType';

export default {
  type: _.NonNull(_.Int),
  args: {
    role: { type: _.NonNull(RoleInputEnumType) },
    email: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { role, email }, { user, db }) {
    await verifyAdminRole(user, db);

    const passkey = generatePasskey(email);
    try {

      const { insertId: userId } = await db.query(`INSERT INTO users (role, email) values (${role}, ${email})`);

      db.query(`INSERT INTO unverified_accounts (user_id, passkey) values (${userId}, ${passkey})`);

      sendEmail(
        email,
        `Регистрация в системе открытого образования ${sitename}`,
        `
          <div>Вы были добавлены в систему открытого образования.</div>
          <div>Проверочный ключ: ${passkey}</div>
          <div>Подтвердите свой аккаунт пройдя по <a href='${url}/account/confirm?email=${encodeURIComponent(JSON.stringify(email))}'>ссылке</a></div>
        `
      );
      
      return userId;

    } catch(error) {

      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Адрес электронный почты '${email}' уже зарегистрирован`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
      
    }
  }
};