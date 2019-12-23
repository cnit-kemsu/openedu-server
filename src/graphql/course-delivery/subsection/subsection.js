import { types as _, upgradeResolveFn, GraphQLError } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';
import SubsectionType from './SubsectionType';
import { sqlBuilder } from './_shared';

export default {
  type: SubsectionType,
  args: {
    id: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { user, db }, { fields }) {
    
    const _user = await verifySignedIn(user);
    await _user.verifyHasAccessToSubsection(id);

    const selectExprList = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_subsections WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;