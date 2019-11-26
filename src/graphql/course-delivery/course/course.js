import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import CourseType from './CourseType';
import { sqlBuilder } from './_shared';

export default {
  type: CourseType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {

    const [selectExprList, params] = sqlBuilder.buildSelectExprList(fields, { userId: user?.id });
    const [course] = await db.query(`SELECT ${selectExprList} FROM course_delivery_instances WHERE id = ?`, [...params, id]);
    
    const { sections } = course;
    if (sections) {
      const _subsections = [];
      const nowDate = new Date();
      for (const { subsections } of sections) {
        if (subsections) for (const subsection of subsections) {
          if (subsection) {
            const { accessDate, expirationDate } = subsection;
            const available = (accessDate ? accessDate <= nowDate : true) && (expirationDate ? expirationDate >= nowDate : true);
            if (available) _subsections.push(subsection);
          }
        }
      }
      const lastIndex = _subsections.length - 1;
      for (let index = 0; index <= lastIndex; index++) {
        const unit = _subsections[index];
        if (index !== 0) unit.prevousSubsectionId = _subsections[index - 1].id;
        if (index !== lastIndex) unit.nextSubsectionId = _subsections[index + 1].id;
      }
    }
    
    return course;
  }
} |> upgradeResolveFn;