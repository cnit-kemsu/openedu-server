import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { CachedValue, Cache } from './Caching';

function finalizeAttempt(a) {
  if (a.lastSubmittedReply !== null) a.lastSubmittedReply = JSON.parse(a.lastSubmittedReply);
  if (a.feedback !== null) a.feedback = JSON.parse(a.feedback);
}

class User extends CachedValue {

  async resolve(db) {

    const [user] = db.query(`SELECT role, email, _data AS data FROM users WHERE id = ${this.id}`);
    if (user === undefined) return;
    Object.assign(this, user);
    if (this.data !== null) this.data = JSON.parse(this.data);

    let courses;
    if (this.role === 'student') {

      courses = await db.query(`
        SELECT course_id key FROM free_course_enrollments WHERE user_id = ${this.id}
        UNION ALL
        SELECT course_id key FROM paid_course_purchases WHERE user_id = ${this.id} AND callback_status = 'success'
      `);

      this.quizAttempts = await db.query(`
        SELECT unit_id unitId, start_date startDate, last_submitted_reply lastSubmittedReply, replies_count repliesCount, score, feedback FROM quiz_attempts WHERE user_id = ${this.id}
      `) |> #?.forEach(finalizeAttempt);

    } else if (this.role === 'instructor' || this.role === 'admin') {
      courses = await db.query(`SELECT course_id key FROM instructor_assignments WHERE user_id = ${this.id}`);
    }
    if (courses !== undefined) this.courseKeys = courses.map(c => c.key);
  }

  hasCourseKey(courseId) {
    return this.courseKeys.find(courseId) !== undefined;
  }

  async hasAccessToSubsection(subsectionId) {
    if (this.role === 'superuser' || this.role === 'admin') return true;
    const subsection = await Cache.find('subsection', subsectionId);
    return this.hasCourseKey(subsection.courseId);
  }

  pushCourseKey(courseId) {
    this.courseKeys.push(courseId);
  }

  async verify_CanEnrollInCourse(courseId) {
    if (this.role !== 'student') throw new GraphQLError(`User with the role '${this.role}' cannot enroll in a course. Only users with the role 'student' are able to enroll in a course`, ClientInfo.UNMET_CONSTRAINT);
    if (this.courseKeys.find(courseId) !== undefined) throw new GraphQLError(`You are already enrolled in the course`, ClientInfo.UNMET_CONSTRAINT);

    const course = await Cache.find('courses', courseId);
    course.verify_AvailableForEnrollment();
  }

  async verify_HasAccessToSubsection(subsectionId) {
    if (this.role === 'superuser' || this.role === 'admin') return;

    const subsection = await Cache.find('subsections', subsectionId);
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the subsection`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the subsection`);
    }
    if (this.role === 'student' && !subsection.isAccessible) throw new GraphQLError(`Access to the subsection has not yet been opened`);
  }

  async verify_HasAccessToUnit(unitId) {
    if (this.role === 'superuser' || this.role === 'admin') return;

    const unit = await units.find(unitId);
    const subsection = await unit.getSubsection();
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the unit`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the unit`);
    }
    if (this.role === 'student' && !subsection.isAccessible) throw new GraphQLError(`Access to the subsection containing the unit has not yet been opened`);
  }

  async verifyCanCreateQuizAttempt(unitId) {
    if (this.role !== 'student') throw new GraphQLError(`User with role '${this.role}' cannot create quiz attempt. Only users with role 'student' are able to create quiz attempt`);
    if (this.quizAttempts.find(a => a.unitId === unitId) !== undefined) throw new GraphQLError(`Attempt to the quiz has already exist`);

    const unit = await units.find(unitId);
    const subsection = await getSubsection(unit.subsectionId);
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the quiz`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the unit`);
    }
    if (!subsection.isAccessOpen) throw new GraphQLError(`Access to the subsection containing the quiz has not yet been opened`);
    if (subsection.expirationDate < new Date()) throw new GraphQLError("Access to the subsection containing the quiz has expired");
  }

  async pushQuizAttempt(unitId, dataValueId, startDate) {
    this.quizAttempts.push({ unitId, dataValueId, startDate, repliesCount: 0 });
  }

  getQuizAttempt(unitId) {
    return this.quizAttempt.find(_attempt => _attempt.unitId === unitId);
  }

}

export const users = new CahedValueArray(User);