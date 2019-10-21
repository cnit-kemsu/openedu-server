import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import { resolveDate } from '@lib/resolvers';
import SectionType from '../section/SectionType';
import UserType from '../../user/UserType';

export default _.Object({
  name: 'CourseDeliveryInstance',
  fields: {

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    creatorId: { type: _.NonNull(_.Int) },
    price: { type: _.Float },
    creationDate: {
      type: _.NonNull(_.String),
      resolve: ({ creationDate }) => resolveDate(creationDate)
    },
    startDate: {
      type: _.String,
      resolve: ({ startDate }) => resolveDate(startDate)
    },
    enrollmentEndDate: {
      type: _.String,
      resolve: ({ enrollmentEndDate }) => resolveDate(enrollmentEndDate)
    },

    description: {
      type: _.JSON,
      resolve: ({ description }) => resolveJSON(description)
    },
    picture: {
      type: _.JSON,
      resolve: ({ picture }) => resolveJSON(picture)
    },
    enrolled: { type: _.Boolean },

    sections: {
      type: _.List(_.NonNull(SectionType)),
      resolve({ id }, {}, { loaders }, { fields }) {
        return loaders.courseDelivery_section_byCourseId.load(id, fields);
      }
    } |> upgradeResolveFn,
    instructors: {
      type: _.List(UserType),
      resolve({ instructors }, {}, { loaders }, { fields }) {
        if (!instructors) return null;
        return loaders.user_byId.loadMany(JSON.parse(instructors), fields);
      }
    } |> upgradeResolveFn

  }
});