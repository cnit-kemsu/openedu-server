import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import { getUserProgress } from '../../../lib/getUserProgress';

const _UserProgressType = _.Object({
  name: '_UserProgress',
  fields: {
    unitName: { type: _.NonNull(_.String) },
    score: { type: _.Int },
    quiz: {
      type: _.JSON
    },
  }
});

const UserProgressType = _.Object({
  name: 'UserProgress',
  fields: {
    units: { type: _.NonNull(_.List(_.NonNull(_UserProgressType))) },
    certificateAvailable: { type: _.Boolean }
  }
});

export default {
  type: UserProgressType,
  args: {
    courseId: { type: _.NonNull(_.Int) },
    userId: { type: _.Int }
  },
  async resolve(obj, { courseId, userId }, { db, user }) {
    if (userId) await verifyAdminRole(user, db);
    const _userId = userId || user.id;

    return await getUserProgress(db, courseId, _userId);
  }
};