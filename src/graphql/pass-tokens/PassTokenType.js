import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from '../course-delivery/course/CourseType';
import UserType from '../user/UserType';

export default _.Object({
  name: 'PassToken',
  fields: {

    id: { type: _.NonNull(_.Int) },
    comments: { type: _.String },

    courseKeys: {
      type: _.NonNull(_.List(_.NonNull(_.Int))),
      resolve: ({ courseKeys }) => resolveJSON(courseKeys)
    },

    emails: {
      type: _.NonNull(_.List(_.NonNull(_.String))),
      resolve: ({ emails }) => resolveJSON(emails)
    },

    courses: {
      type: _.List(CourseType),
      async resolve({ courseKeys }, {}, { loaders }, { fields }) {
        if (!courseKeys) return [];
        const res = await loaders.courseDelivery_instance_byId.loadMany(resolveJSON(courseKeys), { ...fields });
        return res;
      }
    } |> upgradeResolveFn,

    users: {
      type: _.List(UserType),
      async resolve({ emails }, {}, { loaders }, { fields }) {
        if (!emails) return [];
        const _emails = resolveJSON(emails);
        const res = await loaders.user_byEmail.loadMany(_emails, { ...fields });
        return _emails.map(email => ({ email, ...res.find(user => user?.email === email) || { id: -1 } }));
      }
    } |> upgradeResolveFn

  }
});