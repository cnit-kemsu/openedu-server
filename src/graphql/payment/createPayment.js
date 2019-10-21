import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyUserRole } from '@lib/authorization';
import { createPaymentRequest } from '@lib/createPaymentRequest';

export default {
  type: _.NonNull(_.String),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { db, user }) {
    const role = await verifyUserRole(user, db);
    if (role !== 'student') throw new GraphQLError("Only students can pay for a course", ClientInfo.UNMET_CONSTRAINT);

    const [purchase] = await db.query("SELECT id FROM paid_course_purchases WHERE user_id = ? AND course_id = ? AND callback_status != 'failed'", [user.id, courseId]);
    if (purchase) throw new GraphQLError("You've already paid for this course", ClientInfo.UNMET_CONSTRAINT);

    const [{ email, data }] = await db.query('SELECT email, _data data FROM users WHERE id = ?', user.id);
    const [{ price, name, creationDate }] = await db.query('SELECT price, _name name, creation_date creationDate FROM course_delivery_instances WHERE id = ?', courseId);

    const { lastname, firstname, middlename } = JSON.parse(data);
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

    await db.query('INSERT INTO paid_course_purchases SET order_id = ?, user_id = ?, course_id = ?', [order_id, user.id, courseId]);

    return request;
  }
};