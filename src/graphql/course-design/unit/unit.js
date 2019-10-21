import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifyAdminRole } from '@lib/authorization';
import UnitType from './UnitType';
import { sqlBuilder } from './_shared';

export default {
  type: UnitType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {
    await verifyAdminRole(user, db);

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM course_design_units WHERE id = ?`, id)
    |> #[0];
  }
} |> upgradeResolveFn;