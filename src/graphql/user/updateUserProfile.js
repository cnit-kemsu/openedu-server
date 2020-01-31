import { types as _ } from '@kemsu/graphql-server';
import { findUser } from '@lib/authorization';
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
  async resolve(obj, { firstname, lastname, middlename, picture }, { userId, db }) {
    //await verifyUserRole(userId, db);
    if (!userId) throw new Error('Unauthorized');

    let data = { firstname, lastname, middlename };
    if (firstname === undefined && lastname === undefined && middlename === undefined) data = undefined;
    try {

      await db.beginTransaction();

      const assignmentList = await sqlBuilder.buildAssignmentList({ data, picture }, { db });
      if (assignmentList === '') {
        await db.rollback();
        return null;
      }

      const { affectedRows } = await db.query(`UPDATE users SET ${assignmentList} WHERE id = ${userId}`);
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