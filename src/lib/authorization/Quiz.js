import CachedValue from './Caching';
import { getSubsection } from './Subsection';

const quizes = [];

class Quiz extends CachedValue {

  constructor(id, db) {
    super(db);
    this.id = id;
  }

  async _obtain(db) {
    const [entry] = await db.query(`
      SELECT
        subsection_id AS subsectionId,
        _type AS type
      FROM course_delivery_units
      WHERE id = ${this.id}
    `);
    this.subsectionId = entry.subsectionId;
    this.type = entry.type;
  }

  async isAccessOpen() {
    const subsection = await getSubsection(this.subsectionId);
    return subsection.accessDate >= new Date();
  }
}

export async function getQuiz(id, db) {
  let quiz = quizes.find(_quiz => _quiz.id === id);

  if (quiz === undefined) {
    quiz = new Quiz(id, db);
    quizes.push(quiz);
  }

  return await quiz?.obtain();
}