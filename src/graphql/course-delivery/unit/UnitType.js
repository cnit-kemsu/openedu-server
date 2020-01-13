import { types as _, resolveJSON, upgradeResolveFn } from '@kemsu/graphql-server';
import { findUser, findUnit } from '@lib/authorization';
import UnitTypeEnumType from '../../_shared/UnitTypeEnum';
import SubsectionType from '../subsection/SubsectionType';

export default _.Object({
  name: 'CourseDeliveryUnit',
  fields: () => ({

    id: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type: _.NonNull(UnitTypeEnumType) },

    data: {
      type: _.JSON,
      async resolve({ id, data }, {}, { userId, db }) {
        const _data = resolveJSON(data);
        if (_data != null) {

          const user = await findUser(userId, db);
          const unit = await findUnit(id, db);
          if (user.role === 'student' && unit.type === 'quiz') {

            if (!user.hasCourseKey(await unit.getSubsection(db).courseId)) return null;

            if (!user.hasQuizAttempt(id)) delete _data.questions;
            else {
              for (const { answerOptions } of _data.questions) {
                if (answerOptions === undefined) continue;
                for (const option of answerOptions) delete option.correct;
              }
            }
          }
        }
        
        return _data;
      } 
    },

    subsection: {
      type: _.NonNull(SubsectionType),
      resolve({ subsectionId }, {}, { loaders }, { fields }) {
        return loaders.courseDelivery_subsection_byId.load(subsectionId, fields);
      }
    } |> upgradeResolveFn,

    previousUnitId: {
      type: _.Int,
      async resolve({ id: unitId }, {}, { db }) {
        const unit = await findUnit(unitId, db);
        const subsection = await unit.getSubsection(db);
        const course = await subsection.getCourse(db);
        return course.units.find(({ id }) => id === unitId).previousUnitId;
      }
    },

    nextUnitId: {
      type: _.Int,
      async resolve({ id: unitId }, {}, { db }) {
        const unit = await findUnit(unitId, db);
        const subsection = await unit.getSubsection(db);
        const course = await subsection.getCourse(db);
        return course.units.find(({ id }) => id === unitId).nextUnitId;
      }
    }

  })
});