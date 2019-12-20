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
    
    verifySignedIn(user);
    const [{ hasAccess, role }] = await db.query(`SELECT check_user_access_to_entry(${user.id}, 'course_delivery_subsection', ${id}) AS hasAccess, @role role;`);
    if (hasAccess === 'not assigned') throw new GraphQLError("You are not assigned as an instructor to the course containing the subsection");
    if (hasAccess === 'not enrolled') throw new GraphQLError("You are not enrolled in the course containing the subsection");
    if (hasAccess === 'access closed') throw new GraphQLError("Access to the subsection has not yet been opened");
    user.role = role;
    user.roleVerified = true;

    const [selectExprList] = sqlBuilder.buildSelectExprList(fields);
    return await db.query(`SELECT ${selectExprList} FROM course_delivery_subsections WHERE id = ${id}`)
    |> #[0];
  }
} |> upgradeResolveFn;