import { types as _ } from '@kemsu/graphql-server';
import { sendSertificate } from '@lib/sendSertificate';

export default {
  type: _.NonNull(_.Boolean),
  args: {
    courseId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { user, db }) {
    if (!user) throw new Error('Unauthorized');

    try {
      
      await sendSertificate(db, user.id, courseId);
      return true;

    } catch(error) {
      throw error;
    }
  }
};