import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import UnitTypeEnumType from '../../_shared/UnitTypeEnum';
import SubsectionType from '../subsection/SubsectionType';

export default _.Object({
  name: 'CourseDesignUnit',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type:  _.NonNull(UnitTypeEnumType) },

    data: {
      type: _.JSON,
      resolve: ({ data }) => resolveJSON(data)
    },

    subsection: {
      type: _.NonNull(SubsectionType),
      resolve({ subsectionId }, {}, { loaders }, { fields }) {
        return loaders.courseDesign_subsection_byId.load(subsectionId, fields);
      }
    } |> upgradeResolveFn

  })
});