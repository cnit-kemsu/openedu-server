import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import SectionType from '../section/SectionType';

export default _.Object({
  name: 'CourseDesignTemplate',
  fields: {

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    creatorId: { type: _.NonNull(_.Int) },

    description: {
      type: _.JSON,
      resolve: ({ description }) => resolveJSON(description)
    },
    picture: {
      type: _.JSON,
      resolve: ({ picture }) => resolveJSON(picture)
    },

    sections: {
      type: _.List(_.NonNull(SectionType)),
      resolve({ id }, {}, { loaders }, { fields }) {
        return loaders.courseDesign_section_byCourseId.load(id, fields);
      }
    } |> upgradeResolveFn,

    data: {
      type: _.JSON,
      resolve: ({ data }) => resolveJSON(data)
    }

  }
});