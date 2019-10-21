import { Loader, collation } from '@kemsu/graphql-server';

import users from './users';
import totalUsers from './totalUsers';
import userInfo from './userInfo';
import userProfile from './userProfile';
import instructors from './instructors';

import createUser from './createUser';
import deleteUser from './deleteUser';
import updateRole from './updateRole';
import updateUserProfile from './updateUserProfile';

import loaders from './_loaders';

export default {
  query: {
    users,
    totalUsers,
    userInfo,
    instructors,
    userProfile
  },
  mutation: {
    createUser,
    deleteUser,
    updateRole,
    updateUserProfile
  },
  loaders: {
    user_byId: new Loader(loaders.byId, collation.find('id'))
  }
};