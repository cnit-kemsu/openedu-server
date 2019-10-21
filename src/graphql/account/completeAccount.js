import { types as _, signBearer } from '@kemsu/graphql-server';
import { jwtSecret } from '../../config';

export default {
  type: _.NonNull(_.String),
  args: {
    firstname: { type: _.NonNull(_.String) },
    lastname: { type: _.NonNull(_.String) },
    middlename: { type: _.String }
  },
  async resolve(obj, data, { db, user }) {

    await db.query(
      `UPDATE users SET _data = ? WHERE id = ?`,
      [JSON.stringify(data),user.id]
    );
    
    return signBearer({ ...user, complete: true }, jwtSecret);
  }
};