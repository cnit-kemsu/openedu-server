import { types as _, upgradeResolveFn, GraphQLError } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';
import UnitType from './UnitType';
import { sqlBuilder } from './_shared';

export default {
  type: UnitType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {
    
    const _user = await verifySignedIn(user);
    await _user.verifyHasAccessToUnit(id);

    if (_user.role === 'student') {
      fields.type = null;
      fields.hasAttempt = null;
    }
    const selectExprList = sqlBuilder.buildSelectExprList(fields, { user, unitId: id });
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_units WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;