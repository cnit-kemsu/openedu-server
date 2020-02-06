import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from '../course-delivery/course/CourseType';

export default _.Object({
  name: 'CourseDesignTemplate',
  fields: {

    id: { type: _.NonNull(_.Int) },
    courseId: { type: _.NonNull(_.Int) },
    emails: { type: _.NonNull(_.NonNull(_.String)), resolve: ({ emails }) => resolveJSON(emails) },
    comments: { type: _.String },

    course: {
      type: CourseType,
      async resolve({ courseId }, {}, { loaders }, { fields }) {
        return await loaders.courseDelivery_byCourseId.load(courseId, { ...fields });
      }
    } |> upgradeResolveFn

  }
});