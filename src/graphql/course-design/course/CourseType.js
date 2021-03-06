import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';
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
    logo: {
      type: _.JSON,
      resolve: ({ logo }) => resolveJSON(logo)
    },

    sections: {
      type: _.List(_.NonNull(SectionType)),
      async resolve({ id }, {}, { loaders }, { fields }) {
        return await loaders.courseDesign_section_byCourseId.load(id, { ...fields, sequenceNumber: null })
        |> #.sort(sortBySequenceNumber);
      }
    } |> upgradeResolveFn,

    data: {
      type: _.JSON,
      resolve: ({ data }) => resolveJSON(data)
    }

  }
});