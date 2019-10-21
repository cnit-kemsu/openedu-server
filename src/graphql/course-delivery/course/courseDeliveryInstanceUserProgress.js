import { types as _, resolveJSON } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';

const UserProgressType = _.Object({
  name: 'UserProgress',
  fields: {
    unitName: { type: _.NonNull(_.String) },
    score: { type: _.Int },
    quiz: {
      type: _.JSON,
      resolve: ({ quiz }) => resolveJSON(quiz)
    },
  }
});

export default {
  type: _.NonNull(_.List(_.NonNull(UserProgressType))),
  args: {
    courseId: { type: _.NonNull(_.Int) },
    userId: { type: _.Int }
  },
  async resolve(obj, { courseId, userId }, { db, user }) {
    if (userId) await verifyAdminRole(user, db);
    const _userId = userId || user.id;

    return await db.query(`
      SELECT _course_delivery_units._name unitName, _course_delivery_units.quiz, _quiz_attempts.score FROM (
        SELECT id, _name, (SELECT _value FROM _values WHERE id = data_value_id) quiz FROM course_delivery_units WHERE subsection_id IN (
          SELECT id FROM course_delivery_subsections WHERE section_id IN (
            SELECT id FROM course_delivery_sections WHERE course_id = ?
          )
        ) AND _type = 'quiz' 
      ) _course_delivery_units LEFT OUTER JOIN (
        SELECT unit_id, score FROM quiz_attempts WHERE user_id = ?
      ) _quiz_attempts ON _course_delivery_units.id = _quiz_attempts.unit_id
    `, [courseId, _userId]);
  }
};