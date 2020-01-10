import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { findUser, findSubsection } from '@lib/authorization';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';
import { resolveDate } from '@lib/resolvers';
import SectionType from '../section/SectionType';
import UnitType from '../unit/UnitType';

export default _.Object({
  name: 'CourseDeliverySubsection',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    
    accessDate: {
      type: _.String,
      resolve: ({ accessDate }) => resolveDate(accessDate)
    },
    expirationDate: {
      type: _.String,
      resolve: ({ expirationDate }) => resolveDate(expirationDate)
    },

    section: {
      type: _.NonNull(SectionType),
      resolve({ sectionId }, {}, { loaders }, { fields }) {
        return loaders.courseDelivery_section_byId.load(sectionId, fields);
      }
    } |> upgradeResolveFn,

    units: {
      type: _.List(_.NonNull(UnitType)),
      async resolve({ id }, {}, { userId, db, loaders }, { fields }) {

        const user = await findUser(userId, db);
        if (user.role !== 'superuser' && user.role !== 'admin') {
          const subsection = await findSubsection(id, db);
          if (!user.hasCourseKey(subsection.courseId)) return [];
          if (user.role === 'student' && !subsection.isAccessible()) return [];
        }

        return await loaders.courseDelivery_unit_bySubsectionId.load(id, { ...fields, sequenceNumber: null })
        |> #.sort(sortBySequenceNumber);
      }
    } |> upgradeResolveFn,

    previousSubsectionId: { type: _.Int },
    nextSubsectionId: { type: _.Int }

  })
});