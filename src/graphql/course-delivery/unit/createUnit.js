import { types as _, ClientInfo, GraphQLError } from '@kemsu/graphql-server';
import { verifyAdminRole, findSubsection } from '@lib/authorization';
import UnitTypeEnumType from '../../_shared/UnitTypeEnum';
import { sqlBuilder } from './_shared';

export default {
  type: _.NonNull(_.Int),
  args: {
    subsectionId: { type: _.NonNull(_.Int) },
    name: { type: _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type:  _.NonNull(UnitTypeEnumType) },
    data: { type: _.JSON }
  },
  async resolve(obj, inputArgs, { userId, db }) {
    await verifyAdminRole(userId, db);

    try {

      await db.beginTransaction();
      
      const assignmentList = await sqlBuilder.buildAssignmentList(inputArgs, { db });
      const { insertId } = await db.query(`INSERT INTO course_delivery_units SET ${assignmentList}`);
      const subsection = await findSubsection(inputArgs.subsectionId, db);
      const course = await subsection.getCourse(db);
      course.addUnit(insertId, inputArgs.subsectionId);
      await db.commit();
      return insertId;

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