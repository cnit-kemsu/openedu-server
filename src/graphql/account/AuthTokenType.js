import { types as _, resolveJSON } from '@kemsu/graphql-server';

export default _.Object({
  name: 'AuthToken',
  fields: {
    email: { type: _.String },
    role: { type: _.NonNull(_.String) },
    verified: { type: _.NonNull(_.Boolean) },
    complete: { type: _.NonNull(_.Boolean) },
    bearer: { type: _.NonNull(_.String) },
    picture: {
      type: _.JSON,
      resolve: ({ picture }) => resolveJSON(picture)
    }
  }
});