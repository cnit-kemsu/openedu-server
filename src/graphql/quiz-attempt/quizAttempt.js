import { types as _, upgradeResolveFn } from '@kemsu/graphql-server';
import { verifySignedIn } from '@lib/authorization';

export default {
  type: _.JSON,
  args: {
    unitId: { type: _.NonNull(_.Int) }
  },
  async resolve(obj, { unitId }, { user, db }, { fields }) {
    
    verifySignedIn(user);
    const [attempt] = await db.query(`
      SELECT start_date startDate, last_submitted_reply lastSubmittedReply, replies_count repliesCount, score, feedback
      FROM quiz_attempts
      WHERE user_id = ? AND unit_id = ?;
    `, [user.id, unitId]);

    if (!attempt) return attempt;
    if (attempt.lastSubmittedReply) attempt.lastSubmittedReply = JSON.parse(attempt.lastSubmittedReply);
    if (attempt.feedback) attempt.feedback = JSON.parse(attempt.feedback);
    return attempt;
  }
} |> upgradeResolveFn;