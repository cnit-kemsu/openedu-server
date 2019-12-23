import { GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import CachedValue from './CachedValue';
import { getSubsection } from './Subsection';
import { getCourse } from './Course';
import { getUnit } from './Unit';

const users = [];

class User extends CachedValue {

  constructor(id, db) {
    super(db);
    this.id = id;
  }

  async _obtain(db) {

    const user = await db.query(`SELECT role, email, _data AS data FROM users WHERE id = ${this.id}`)
    |> #[0];

    if (user === undefined) throw new GraphQLError("Invalid user", ClientInfo.PERMISSION_DENIED);
    this.role = user.role;
    this.email = user.email;
    this.data = user.data !== null ? JSON.parse(user.data) : null;

    let courses;
    if (this.role === 'student') {

      courses = await db.query(`
        SELECT course_id id FROM free_course_enrollments WHERE user_id = ${this.id}
        UNION ALL
        SELECT course_id id FROM paid_course_purchases WHERE user_id = ${this.id} AND callback_status = 'success'
      `);

      this.quizAttempt = await db.query(`
        SELECT unit_id unitId, start_date startDate, last_submitted_reply lastSubmittedReply, replies_count repliesCount, score, feedback FROM quiz_attempts WHERE user_id = ${this.id}
      `) |> #?.forEach(_attempt => {
        if (_attempt.lastSubmittedReply !== null) _attempt.lastSubmittedReply = JSON.parse(_attempt.lastSubmittedReply);
        if (_attempt.feedback  !== null) _attempt.feedback = JSON.parse(_attempt.feedback);
      });

    } else if (this.role === 'instructor' || this.role === 'admin') {
      courses = await db.query(`SELECT course_id id FROM instructor_assignments WHERE user_id = ${this.id}`);
    }
    if (courses !== undefined) this.courseKeys = courses.map(_course => _course.id);

  }

  async verifyCanEnrollToCourse(courseId) {
    if (this.role !== 'student') throw new GraphQLError("Only students can enroll to course", ClientInfo.UNMET_CONSTRAINT);
    if (this.courseKeys.find(courseId) !== undefined) throw new GraphQLError("You are already enrolled to the course", ClientInfo.UNMET_CONSTRAINT);

    const course = await getCourse(courseId);
    if (course.enrollmentEndDate !== null) throw new GraphQLError(`You must pay first before enroll to the course`, ClientInfo.UNMET_CONSTRAINT);
    if (course.enrollmentEndDate < new Date()) throw new GraphQLError(`Course enrollment expired`, ClientInfo.UNMET_CONSTRAINT);;
  }

  async verifyHasAccessToSubsection(subsectionId) {
    if (this.role === 'superuser' || this.role === 'admin') return;
    const subsection = await getSubsection(subsectionId);
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the subsection`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the subsection`);
    }
    if (this.role === 'student' && !subsection.isAccessOpen) throw new GraphQLError(`Access to the subsection has not yet been opened`);
  }

  async verifyHasAccessToUnit(unitId) {
    if (this.role === 'superuser' || this.role === 'admin') return;
    const unit = await getUnit(unitId);
    const subsection = await getSubsection(unit.subsectionId);
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the unit`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the unit`);
    }
    if (this.role === 'student' && !subsection.isAccessOpen) throw new GraphQLError(`Access to the subsection containing the unit has not yet been opened`);
  }

  async verifyCanCreateQuizAttempt(unitId) {
    if (this.role !== 'student') throw new GraphQLError(`User with role '${this.role}' cannot create quiz attempt. Only users with role 'student' are able to create quiz attempt`);
    if (this.quizAttemptKeys.find(_attempt => _attempt.unitId === unitId) !== undefined) throw new GraphQLError(`Attempt to the quiz has already exist`);

    const unit = await getUnit(unitId);
    const subsection = await getSubsection(unit.subsectionId);
    const courseId = this.courseKeys.find(subsection.courseId);
    if (courseId === undefined) {
      if (this.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the quiz`);
      else if (this.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the unit`);
    }
    if (!subsection.isAccessOpen) throw new GraphQLError(`Access to the subsection containing the quiz has not yet been opened`);
    if (subsection.expirationDate < new Date()) throw new GraphQLError("Access to the subsection containing the quiz has expired");
  }

  getQuizAttempt(unitId) {
    return this.quizAttempt.find(_attempt => _attempt.unitId === unitId);
  }

}

export async function getUser(id, db) {
  let user = users.find(_user => _user.id === id);

  if (user === undefined) {
    user = new User(id, db);
    users.push(user);
  }

  return await user?.obtain();
}