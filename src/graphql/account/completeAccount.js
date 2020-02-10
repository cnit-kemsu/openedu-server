import { types as _, signBearer, jsonToString } from '@kemsu/graphql-server';
import { jwtSecret } from '../../../config';

export default {
  type: _.NonNull(_.String),
  args: {
    firstname: { type: _.NonNull(_.String) },
    lastname: { type: _.NonNull(_.String) },
    middlename: { type: _.String }
  },
  async resolve(obj, data, { userId, db }) {

    await db.query(
      `UPDATE users SET _data = ${jsonToString(data)} WHERE id = ${userId}`
    );
    
    return signBearer({ userId, complete: true }, jwtSecret);
  }
};