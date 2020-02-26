import { types as _ } from '@kemsu/graphql-server';
import { findUser, findCourse } from '@lib/authorization';
//import { getUserProgress } from '@/lib/getUserProgress';

const UnitUserProgressType = _.Object({
  name: 'UnitUserProgress',
  fields: {
    id: { type: _.Int },
    unitName: { type: _.NonNull(_.String) },
    score: { type: _.Int },
    maxScore: { type: _.Int }
  }
});

const CourseUserProgressType = _.Object({
  name: 'CourseUserProgress',
  fields: {
    units: { type: _.NonNull(_.List(_.NonNull(UnitUserProgressType))) },
    certificateAvailable: { type: _.Boolean },
    userData: { type: _.JSON }
  }
});

export default {
  type: _.List(CourseUserProgressType),
  args: {
    courseId: { type: _.NonNull(_.Int) },
  },
  async resolve(obj, { courseId }, { userId, db }) {
    const user = await findUser(userId, db);
    const course = await findCourse(courseId, db);
    const courseFinalAttempts = course.units.filter(({ type, finalCertification }) => type === 'quiz' && finalCertification);
    const unitKeys = courseFinalAttempts.map(({ id }) => id);

    if (user.role === 'student') {
      const userFinalAttempts = user.quizAttempts.filter(({ unitId }) => unitKeys.includes(unitId));
      const _userFinalAttempts = courseFinalAttempts.map(({ id, ...other }) => ({ id, ...other, ...userFinalAttempts.find(a => a.unitId === id) }));
      const certificateAvailable = courseFinalAttempts.length === userFinalAttempts.length;
      return [{
        units: _userFinalAttempts,
        certificateAvailable
      }];
    }

    const users = await db.query(`
      SELECT id, _data AS data, get_value(picture_value_id) AS picture, email FROM users
      JOIN (
        SELECT user_id, course_id FROM free_course_enrollments
        UNION ALL
        SELECT user_id, course_id FROM paid_course_purchases WHERE callback_status='success'
      ) AS enrollments ON users.id = user_id
      WHERE course_id IN (${courseId})
    `);

    let courseAttempts = unitKeys.length === 0 ? [] : await db.query(`
      SELECT
        unit_id unitId,
        user_id userId,
        start_date startDate,
        last_submitted_reply lastSubmittedReply,
        replies_count repliesCount,
        score,
        feedback
      FROM quiz_attempts
      WHERE
        unit_id IN (${unitKeys.join(', ')})
    `);
    courseAttempts = courseAttempts.filter(({ unitId }) => unitKeys.includes(unitId));

    const userFinalAttemptsArray = [];
    for (const _user of users) {
      const userFinalAttempts = courseAttempts.filter(({ userId: _userId }) => _user.id === _userId).map(val => ({ ...val, ...courseFinalAttempts.find(({ id }) => id === val.unitId) }));
      const certificateAvailable = courseFinalAttempts.length === userFinalAttempts.length; 
      const userData = JSON.parse(_user.data);
      userData.id = _user.id;
      userData.picture = _user.picture != null ? JSON.parse(_user.picture) : null;
      userData.email = _user.email;

      let allScores = 0;
      let maxAllScores = 0;
      if (userFinalAttempts) for (const unitProgress of userFinalAttempts) {
        //if (!unitProgress.finalCertification) continue;
        allScores += unitProgress.score;
        maxAllScores += unitProgress.maxScore;
      }
      userData.allScores = allScores;
      userData.maxAllScores = maxAllScores;

      const _userFinalAttempts = courseFinalAttempts.map(({ id, ...other }) => ({ attemptId: id, ...other, ...userFinalAttempts.find(a => a.unitId === id) }));
      userFinalAttemptsArray.push({ units: _userFinalAttempts, certificateAvailable, userData });
    }

    return userFinalAttemptsArray;
  }
};