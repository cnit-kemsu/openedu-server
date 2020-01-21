import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, findSubsection } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const subsection = await findSubsection(id, db);
    const { affectedRows } = await db.query(`DELETE FROM course_delivery_subsections WHERE id = ${id}`);
    
    const course = await subsection.getCourse(db);
    course.removeSubsection(id);
    return affectedRows;
  }
};