import { types as _ } from '@kemsu/graphql-server';
import { verifyUserRole } from '@lib/authorization';
import UserType from './UserType';
import { sqlBuilder } from './_shared';

export default {
  type: UserType,
  args: {
    firstname: { type: _.String },
    lastname: { type: _.String },
    middlename: { type: _.String },
    picture: { type: _.JSON }
  },
  async resolve(obj, { firstname, lastname, middlename, picture }, { db, user }) {
    await verifyUserRole(user, db);

    const data = { firstname, lastname, middlename };
    try {

      await db.beginTransaction();

      const assignmentList = await sqlBuilder.buildAssignmentList({ data, picture }, { db });
      if (assignmentList === '') {
        await db.rollback();
        return null;
      }

      const { affectedRows } = await db.query(`UPDATE users SET ${assignmentList} WHERE id = ${user.id}`);
      await db.commit();
      if (affectedRows === 1) return {
        firstname,
        lastname,
        middlename,
        picture: picture ? JSON.stringify(picture) : undefined
      };
      return null;

    } catch(error) {

      await db.rollback();
      throw error;
      
    }
  }
};