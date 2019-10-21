import { types as _ } from '@kemsu/graphql-server';

export default _.EnumType({
  name: 'RoleInputEnum',
  values: {
    ADMIN: { value: 'admin' },
    INSTRUCTOR: { value: 'instructor' }
  }
});