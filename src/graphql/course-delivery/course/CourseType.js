import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import { resolveDate } from '@lib/resolvers';
import { findUser } from '@lib/authorization';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';
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
    isEnrolledToCourse: { type: _.Boolean },

    sections: {
      type: _.List(_.NonNull(SectionType)),
      async resolve({ id }, {}, { loaders }, { fields }) {
        return await loaders.courseDelivery_section_byCourseId.load(id, { ...fields, sequenceNumber: null })
        |> #.sort(sortBySequenceNumber);
      }
    } |> upgradeResolveFn,

    instructors: {
      type: _.List(UserType),
      resolve({ id }, {}, { loaders }, { fields }) {
        return loaders.user_instructor_byCourseId.load(id, fields);
      }
    } |> upgradeResolveFn,

    students: {
      type: _.List(UserType),
      resolve({ id }, {}, { loaders }, { fields }) {
        return loaders.user_student_byCourseId.load(id, fields);
      }
    } |> upgradeResolveFn,

    data: {
      type: _.JSON,
      resolve: ({ data }) => resolveJSON(data)
    },

    isCurrentUserEnrolled: {
      type: _.Boolean,
      async resolve({ id }, {}, { userId, db }) {
        const user = await findUser(userId, db);
        return user.hasCourseKey(id);
      }
    }

  }
});