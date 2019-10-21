import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from '../course/CourseType';
import SubsectionType from '../subsection/SubsectionType';

export default _.Object({
  name: 'CourseDesignSection',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },

    course: {
      type: _.NonNull(CourseType),
      resolve({ courseId }, {}, { loaders }, { fields }) {
        return loaders.courseDesign_template_byId.load(courseId, fields);
      }
    } |> upgradeResolveFn,
    subsections: {
      type: _.List(_.NonNull(SubsectionType)),
      resolve({ id }, {}, { loaders }, { fields }) {
        return loaders.courseDesign_subsection_bySectionId.load(id, fields);
      }
    } |> upgradeResolveFn

  })
});