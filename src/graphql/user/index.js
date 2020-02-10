import { Loader, collation } from '@kemsu/graphql-server';

import allUsers from './allUsers';
import totalUsers from './totalUsers';
import userInfo from './userInfo';
import userProfile from './userProfile';

import createUser from './createUser';
import deleteUser from './deleteUser';
import updateRole from './updateRole';
import updateUserProfile from './updateUserProfile';

import loaders from './_loaders';

export default {
  query: {
    allUsers,
    totalUsers,
    userInfo,
    userProfile
  },
  mutation: {
    createUser,
    deleteUser,
    updateRole,
    updateUserProfile
  },
  loaders: {
    user_byId: new Loader(loaders.byId, collation.find('id')),
    user_byEmail: new Loader(loaders.byEmail, collation.find('email')),
    user_instructor_byCourseId: new Loader(loaders.instructor_byCourseId, collation.filter('courseId')),
    user_student_byCourseId: new Loader(loaders.student_byCourseId, collation.filter('courseId'))
  }
};