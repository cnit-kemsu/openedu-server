import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { findUser, findCourse } from '@lib/authorization';
import { createPaymentRequest } from '@lib/createPaymentRequest';

export default {
  type: _.NonNull(_.String),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { userId, db }) {
    const user = await findUser(userId, db);

    const { email, data } = user;
    const { price, name, creationDate } = await findCourse(courseId, db);

    const { lastname, firstname, middlename } = data;
    const [request, { order_id }] = createPaymentRequest(price, {
      user: {
        id: user.id,
        email,
        lastname,
        firstname,
        middlename
      },
      course: {
        id: courseId,
        name,
        price,
        creationDate
      }
    });

    await db.query(`INSERT INTO paid_course_purchases SET order_id = ${order_id}, user_id = ${userId}, course_id = ${courseId}`);

    return request;
  }
};