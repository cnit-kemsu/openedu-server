// import { types as _, authorize, PublicError, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
// import { generatePasskey } from './_shared';
// import { sendEmail } from '../sendEmail';
// import { createPaymentRequest } from '../createPaymentRequest';

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

// const makePaymentQuery = {
//   type: new _.NonNull(_.String),
//   args: {
//     courseDeliveryInstanceId: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { courseDeliveryInstanceId }, { db, user }) {
//     authorize(user);

//     const [{ email, data: { lastname, firstname, middlename } }] = await db.query('SELECT email, _data data FROM users WHERE id = ?', user.id);
//     const [{ price, name, creationDate }] = await db.query('SELECT name, creation_date creationDate FROM course_delivery_instances WHERE id = ?', courseDeliveryInstanceId);

//     const date = new Date();


//     const request = createPaymentRequest(courseDeliveryInstanceId, user.id, date, price, {
//       user: {
//         email,
//         lastname,
//         firstname,
//         middlename
//       },
//       courseDeliveryInstanceId: {
//         name,
//         creationDate
//       }
//     });

//     return request;
//   }
// };