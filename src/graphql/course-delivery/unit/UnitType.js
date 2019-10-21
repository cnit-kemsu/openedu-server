import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import UnitTypeEnumType from '../../_shared/UnitTypeEnum';
import SubsectionType from '../subsection/SubsectionType';

export default _.Object({
  name: 'CourseDeliveryUnit',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type:  _.NonNull(UnitTypeEnumType) },

    data: {
      type: _.JSON,
      resolve(unit, {}, { user }) {
        const data = resolveJSON(unit.data);

        if (data != null && user.role === 'student' && unit.type === 'quiz') {

          if (unit.hasAttempt == null) delete data.questions;
          else {
            const { questions } = data;
            for (const { answerOptions } of questions) {
              if (answerOptions === undefined) continue;
              for (const option of answerOptions) delete option.correct;
            }
          }
        }
        
        return data;
      } 
    },

    subsection: {
      type: _.NonNull(SubsectionType),
      resolve({ subsectionId }, {}, { loaders }, { fields }) {
        return loaders.courseDelivery_subsection_byId.load(subsectionId, fields);
      }
    } |> upgradeResolveFn

  })
});