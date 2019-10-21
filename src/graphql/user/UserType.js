import { types as _, resolveJSON } from '@kemsu/graphql-server';
import RoleEnumType from './RoleEnumType';

export default _.Object({
  name: 'User',
  fields: {
    id: { type: _.NonNull(_.Int) },
    role: { type: RoleEnumType },
    email: { type: _.NonNull(_.String) },
    verified: { type: _.NonNull(_.Boolean) },
    firstname: { type: _.String },
    lastname: { type: _.String },
    middlename: { type: _.String },
    picture: {
      type: _.JSON,
      resolve: ({ picture }) => resolveJSON(picture)
    }
  }
});