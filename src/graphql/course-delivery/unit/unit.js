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
    
    verifySignedIn(user);
    const [{ hasAccess, role }] = await db.query(`SELECT check_user_access_to_entry(?, 'course_delivery_unit', ?) AS hasAccess, get_session_user_role() role;`, [user.id, id]);
    if (hasAccess === 'not assigned') throw new GraphQLError("You are not assigned as an instructor to the course containing the unit");
    if (hasAccess === 'not enrolled') throw new GraphQLError("You are not enrolled in the course containing the unit");
    if (hasAccess === 'access closed') throw new GraphQLError("Access to the subsection containing the unit has not yet been opened");
    user.role = role;
    user.roleVerified = true;

    if (role === 'student') {
      fields.type = null;
      fields.hasAttempt = null;
    }
    const [selectExprList, params] = sqlBuilder.buildSelectExprList(fields, { userId: user.id, unitId: id });
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_units WHERE id = ?`, [...params, id])
    |> #[0];
  }
} |> upgradeResolveFn;