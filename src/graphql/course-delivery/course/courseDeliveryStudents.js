import { types as _ } from '@kemsu/graphql-server';
import UserType from '../../user/UserType';
import { verifyAdminRole } from '@lib/authorization';

export default {
  type: _.List(UserType),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { db, user }) {
    await verifyAdminRole(user, db);

    return db.query(`
      SELECT id, JSON_VALUE(_data, '$.firstname') firstname, JSON_VALUE(_data, '$.lastname') lastname, JSON_VALUE(_data, '$.middlename') middlename, email, (SELECT _value FROM _values WHERE _values.id = picture_value_id) picture
      FROM users WHERE id IN (SELECT user_id FROM free_course_enrollments WHERE course_id = ?)
    `, [courseId]);
  }
};