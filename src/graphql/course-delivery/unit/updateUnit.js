import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import UnitTypeEnumType from '../../_shared/UnitTypeEnum';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    id: { type: _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String },
    type: { type: UnitTypeEnumType },
    data: { type: _.JSON }
  },
  async resolve(obj, { id, ...inputArgs }, { user, db }) {
    await verifyAdminRole(user, db);

    try {

      await db.beginTransaction();

      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      if (assignmentList === '') {
        await db.rollback();
        return 0;
      }
      const { affectedRows } = await db.query(`UPDATE course_delivery_units SET ${assignmentList} WHERE id = ${id}`);
      
      await db.commit();
      return affectedRows;

    } catch(error) {

      await db.rollback();
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Блок с названием '${inputArgs.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;

    }
  }
};