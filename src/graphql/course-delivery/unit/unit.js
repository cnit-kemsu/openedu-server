import { types as _, upgradeResolveFn, GraphQLError, ClientInfo } from '@kemsu/graphql-server';
import { findUser, findUnit } from '@lib/authorization';
import UnitType from './UnitType';
import { sqlBuilder } from './_shared';

export default {
  type: UnitType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { userId, db }, { fields }) {
    
    const user = await findUser(userId, db);
    let unit;
    if (user.role !== 'superuser' && user.role !== 'admin') {

      unit = await findUnit(id);
      if (!user.hasCourseKey(await unit.getSubsection().courseId)) {
        if (user.role === 'student') throw new GraphQLError(`You are not enrolled in the course containing the unit`, ClientInfo.UNMET_CONSTRAINT);
        else if (user.role === 'instructor') throw new GraphQLError(`You are not assigned as an instructor to the course containing the unit`, ClientInfo.UNMET_CONSTRAINT);
      }
      if (user.role === 'student' && await !unit.isAccessible()) throw new GraphQLError(`Access to the subsection containing the unit has not yet been opened`, ClientInfo.UNMET_CONSTRAINT);

      delete fields.id;
      delete fields.type;
      delete fields.subsectionId;
      delete fields.subsection;
    }
    
    const selectExprList = sqlBuilder.buildSelectExprList(fields, { userId, unitId: id });
    if (selectExprList === '*') return { id };
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_units WHERE id = ${id}`)
    |> {
      ...unit,
      ...#[0]
    };
  }
} |> upgradeResolveFn;