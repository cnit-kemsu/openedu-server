import { types as _ } from '@kemsu/graphql-server';

export default _.EnumType({
  name: 'RoleEnum',
  values: {
    ADMIN: { value: 'admin' },
    INSTRUCTOR: { value: 'instructor' },
    SUPERUSER: { value: 'superuser' },
    STUDENT: { value: 'student' }
  }
});