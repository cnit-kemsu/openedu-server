import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { sortByIndexNumber } from '@lib/sortByIndexNumber';
import SectionType from '../section/SectionType';
import UnitType from '../unit/UnitType';

export default _.Object({
  name: 'CourseDesignSubsection',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    accessPeriod: { type: _.Int },
    expirationPeriod: { type: _.Int },

    section: {
      type: _.NonNull(SectionType),
      resolve({ sectionId }, {}, { loaders }, { fields }) {
        return loaders.courseDesign_section_byId.load(sectionId, fields);
      }
    } |> upgradeResolveFn,
    units: {
      type: _.List(_.NonNull(UnitType)),
      async resolve({ id }, {}, { loaders }, { fields }) {
        fields.indexNumber = null;
        const units = await loaders.courseDesign_unit_bySubsectionId.load(id, fields);
        if (units) return units.sort(sortByIndexNumber);
        return units;
      }
    } |> upgradeResolveFn

  })
});