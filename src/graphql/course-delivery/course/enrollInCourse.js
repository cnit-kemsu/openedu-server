import { types as _, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { findUser, findCourse } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { userId, db }) {

    const user = await findUser(userId, db);
    if (user.role !== 'student') throw new GraphQLError(`User with the role '${this.role}' cannot enroll in a course. Only users with the role 'student' are able to enroll in courses`, ClientInfo.UNMET_CONSTRAINT);
    if (user.hasCourseKey(courseId)) throw new GraphQLError(`You are already enrolled in the course`, ClientInfo.UNMET_CONSTRAINT);

    const course = await findCourse(courseId, db);
    if (course.price !== null) throw new GraphQLError(`You must pay to enroll in the course`, ClientInfo.UNMET_CONSTRAINT);
    if (course.enrollmentEndDate != null && course.enrollmentEndDate < new Date()) throw new GraphQLError(`Enrollment has expired`, ClientInfo.UNMET_CONSTRAINT);

    await db.query(`CALL enroll_user_into_free_course(${user.id}, ${courseId})`);

    user.pushCourseKey(courseId);
    return 1;
  }
};