// import { types as _, hashPassword, verifyPassword, authorize, PublicError, GraphQLError, ClientInfo, signBearer } from '@kemsu/graphql-server';
// import { jwtSecret, sitename } from '../../config';
// import { generatePasskey } from '../_shared';
// import { sendEmail } from '../../sendEmail';

// export const AuthTokenType = new _.Object({
//   name: 'AuthToken',
//   fields: {
//     role: { type: new _.NonNull(_.String) },
//     verified: { type: new _.NonNull(_.Boolean) },
//     complete: { type: new _.NonNull(_.Boolean) },
//     bearer: { type: new _.NonNull(_.String) },
//     picture: { type: _.JSON }
//   }
// });

// const signIntoAccount = {
//   type: AuthTokenType,
//   args: {
//     email: { type: new _.NonNull(_.String) },
//     password: { type: new _.NonNull(_.String) }
//   },
//   async resolve(obj, { email, password }, { db }) {
//     const [{ pwdhash, data, picture, passkey, ...user } = {}] = await db.query(
//       `SELECT id, role, pwdhash, _data data, (SELECT _value FROM _values WHERE _values.id = picture_value_id) picture, passkey
//       FROM users
//       LEFT JOIN unverified_accounts ON id = user_id
//       WHERE email = ?`,
//       email
//     );

//     user.complete = data !== null;
//     user.verified = passkey === null;
//     if (pwdhash !== undefined
//       && verifyPassword(password, pwdhash)
//     ) return {
//       ...user,
//       picture: picture && JSON.parse(picture),
//       bearer: signBearer(user, jwtSecret)
//     };
//     throw new PublicError('Неверный адрес электронной почты или пароль', ClientInfo.UNMET_CONSTRAINT);
//   }
// };

// const signUpAccount = {
//   type: new _.NonNull(_.String),
//   args: {
//     email: { type: new _.NonNull(_.String) },
//     password: { type: new _.NonNull(_.String) },
//     firstname: { type: new _.NonNull(_.String) },
//     lastname: { type: new _.NonNull(_.String) },
//     middlename: { type: _.String }
//   },
//   async resolve(obj, { email, password, firstname, lastname, middlename }, { db }) {

//     try {

//       const { insertId: id } = await db.query(
//         `INSERT INTO users (role, email, pwdhash, _data) values ('student', ?, ?, ?)`, [
//         email,
//         hashPassword(password),
//         JSON.stringify({
//           firstname,
//           lastname,
//           middlename
//         })
//       ]);

//       generatePasskey(email) |> [
//         db.query(`INSERT INTO unverified_accounts (user_id, passkey) values (?, ?)`, [id, #]),
//         sendEmail(email, `Регистрация в системе открытого образования ${sitename}`, `
//           <div>Вы были зарегистрированы в системе открытого образования.</div>
//           <div>Проверочный ключ: ${#}</div>
//         `)
//       ];
      
//       return signBearer({ id, role: 'student', email, verified: false, complete: true }, jwtSecret);

//     } catch(error) {
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Адрес электронный почты '${email}' уже зарегистрирован`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const verifyAccount = {
//   type: new _.NonNull(_.String),
//   args: {
//     email: { type: _.String },
//     passkey: { type: new _.NonNull(_.String) }
//   },
//   async resolve(obj, { passkey }, { db, user }) {
//     authorize(user);
//     if (user.role !== 'student') throw new GraphQLError("The role must be equal to 'student'");

//     const [account] = await db.query(`SELECT passkey FROM unverified_accounts WHERE user_id = ?`, user.id);
//     if (account === undefined) return 0;
//     if (account.passkey !== passkey) throw new GraphQLError(
//       'Неверный проверочный ключ',
//       ClientInfo.UNMET_CONSTRAINT
//     );
//     db.query(`DELETE FROM unverified_accounts WHERE user_id = ?`, user.id);

//     return signBearer({ ...user, verified: true }, jwtSecret);
//   }
// };

// const confirmAccount = {
//   type: new _.NonNull(_.String),
//   args: {
//     email: { type: new _.NonNull(_.String) },
//     password: { type: new _.NonNull(_.String) },
//     passkey: { type: new _.NonNull(_.String) }
//   },
//   async resolve(obj, { email, password, passkey }, { db }) {

//     const [{ accountPasskey, ...user } = {}] = await db.query(
//       `SELECT id, role, passkey accountPasskey
//       FROM users
//       RIGHT JOIN unverified_accounts ON id = user_id
//       WHERE email = ?`,
//       email
//     );
//     if (accountPasskey === undefined) return 0;
//     if (accountPasskey !== passkey) throw new GraphQLError(
//       'Неверный проверочный ключ',
//       ClientInfo.UNMET_CONSTRAINT
//     );
//     db.query(`UPDATE users SET pwdhash = ? WHERE id = ?`, [ hashPassword(password), user.id ]);
//     db.query(`DELETE FROM unverified_accounts WHERE user_id = ?`, user.id);
    
//     return signBearer({ ...user, verified: true, complete: false }, jwtSecret);
//   }
// };

// const completeAccount = {
//   type: new _.NonNull(_.String),
//   args: {
//     firstname: { type: new _.NonNull(_.String) },
//     lastname: { type: new _.NonNull(_.String) },
//     middlename: { type: _.String }
//   },
//   async resolve(obj, { firstname, lastname, middlename }, { db, user }) {

//     await db.query(`UPDATE users SET _data = ? WHERE id = ?`, [
//       JSON.stringify({
//         firstname,
//         lastname,
//         middlename
//       }),
//       user.id
//     ]);
    
//     return signBearer({ ...user, complete: true }, jwtSecret);
//   }
// };

// export default [{
// }, {
//   signIntoAccount,
//   signUpAccount,
//   verifyAccount,
//   confirmAccount,
//   completeAccount
// }];