import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, findSection } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    const section = await findSection(id, db);
    const { affectedRows } = await db.query(`DELETE FROM course_delivery_sections WHERE id = ${id}`);
    
    const course = await section.getCourse(db);
    course.removeSection(id);
    return affectedRows;
  }
};