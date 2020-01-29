import { types as _ } from '@kemsu/graphql-server';
import { findUser, findCourse } from '@lib/authorization';
//import { getUserProgress } from '@/lib/getUserProgress';

const UnitUserProgressType = _.Object({
  name: 'UnitUserProgress',
  fields: {
    unitName: { type: _.NonNull(_.String) },
    score: { type: _.Int },
    maxScore: { type: _.Int }
  }
});

const CourseUserProgressType = _.Object({
  name: 'CourseUserProgress',
  fields: {
    units: { type: _.NonNull(_.List(_.NonNull(UnitUserProgressType))) },
    certificateAvailable: { type: _.Boolean }
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

    if (user.role === 'student') {
      const userFinalAttempts = user.quizAttempts.filter(({ finalCertification }) => finalCertification);
      const certificateAvailable = courseFinalAttempts.length === userFinalAttempts.length;
      return [{
        units: userFinalAttempts,
        certificateAvailable
      }];
    }

    // if (userId) await verifyAdminRole(user, db);
    // const _userId = userId || user.id;

    // return await getUserProgress(db, courseId, _userId);
  }
};