import { CachedValue, Cache } from './Caching';

function finalizeAttempt(a) {
  if (a.lastSubmittedReply !== null) a.lastSubmittedReply = JSON.parse(a.lastSubmittedReply);
  if (a.feedback !== null) a.feedback = JSON.parse(a.feedback);
}

class User extends CachedValue {

  async resolve(db) {

    const [user] = db.query(`SELECT role, email, _data AS data FROM users WHERE id = ${this.key}`);
    if (user === undefined) return;
    if (user.data !== null) user.data = JSON.parse(user.data);

    let courses;
    if (user.role === 'student') {

      courses = await db.query(`
        SELECT course_id key FROM free_course_enrollments WHERE user_id = ${this.key}
        UNION ALL
        SELECT course_id key FROM paid_course_purchases WHERE user_id = ${this.key} AND callback_status = 'success'
      `);

      user.quizAttempts = await db.query(`
        SELECT unit_id unitId, start_date startDate, last_submitted_reply lastSubmittedReply, replies_count repliesCount, score, feedback FROM quiz_attempts WHERE user_id = ${this.key}
      `) |> #?.forEach(finalizeAttempt);

    } else if (user.role === 'instructor' || user.role === 'admin') {
      courses = await db.query(`SELECT course_id key FROM instructor_assignments WHERE user_id = ${this.key}`);
    }
    if (courses !== undefined) user.courseKeys = courses.map(c => c.key);
    
    user.id = this.key;
    return user;
  }

  hasCourseKey(courseId) {
    return this.courseKeys.includes(courseId);
  }

  pushCourseKey(courseId) {
    this.courseKeys.push(courseId);
  }

  hasQuizAttempt(unitId) {
    return this.includes.includes(a => a.unitId === unitId);
  }

  getQuizAttempt(unitId) {
    return this.quizAttempts.find(a => a.unitId === unitId);
  }

  pushQuizAttempt(unitId, dataValueId, startDate) {
    this.quizAttempts.push({ unitId, dataValueId, startDate, repliesCount: 0 });
  }

  updateQuizAttempt(unitId, data) {
    const attempt = this.getQuizAttempt(unitId);
    Object.assign(attempt, data)
  }

}

Cache.createCachedValues('users', User);