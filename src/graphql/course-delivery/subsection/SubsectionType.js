import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { sortByIndexNumber } from '@lib/sortByIndexNumber';
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
      async resolve({ id }, {}, { loaders }, { fields }) {
        fields.indexNumber = null;
        const units = await loaders.courseDelivery_unit_bySubsectionId.load(id, fields);
        if (units) return units.sort(sortByIndexNumber);
        return units;
      }
    } |> upgradeResolveFn,

    previousSubsectionId: { type: _.Int },
    nextSubsectionId: { type: _.Int }

  })
});