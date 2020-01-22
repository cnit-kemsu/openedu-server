import { types as _ } from '@kemsu/graphql-server';
import { verifyAdminRole, findSubsection } from '@lib/authorization';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }) {
    await verifyAdminRole(userId, db);

    /*cache*/const subsection = await findSubsection(id, db);
    /*cache*/const course = await subsection.getCourse(db);

    const { affectedRows } = await db.query(`DELETE FROM course_delivery_subsections WHERE id = ${id}`);
    
    /*cache*/course.removeSubsection(id);
    
    return affectedRows;
  }
};