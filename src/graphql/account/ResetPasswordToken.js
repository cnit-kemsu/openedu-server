import { types as _, GraphQLError, ClientInfo, _escape } from '@kemsu/graphql-server';
import { generatePasskey } from '@lib/generatePasskey';
import { sendEmail } from '@lib/sendEmail';
import { sitename } from '../../../config';

export default {
  type: _.NonNull(_.Int),
  args: {
    email: { type: _.NonNull(_.String) }
  },
  async resolve(obj, { email }, { db }) {

    const passkey = generatePasskey(email);
    try {

      const { affectedRows } = await db.query(`UPDATE users SET pwdreset_token = '${passkey}' WHERE email = ${_escape(email)}`);
      if (affectedRows === 0) throw new GraphQLError(
        `Адрес электронный почты '${email}' не зарегистрирован`,
        ClientInfo.UNMET_CONSTRAINT
      );

      sendEmail(
        email,
        `Смена пароля в системе открытого образования ${sitename}`,
        `
          <div>Вы сделали запрос на смену пароля.</div>
          <div>Проверочный ключ: ${passkey}</div>
        `
      );
      
      return affectedRows;

    } catch(error) {
      throw error;
    }
  }
};