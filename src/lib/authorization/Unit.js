import { CachedValue, Cache } from './Caching';

export default class Unit extends CachedValue {

  async resolve(db) {
    const [unit] = await db.query(`
      SELECT
        subsection_id AS subsectionId,
        _type AS type,
        IF(_type = 'quiz', get_value(data_value_id), NULL) data
      FROM course_delivery_units
      WHERE id = ${this.key}
    `);
    if (unit === undefined) return;
    if (unit.data !== null) {
      unit.data = JSON.parse(unit.data);
      for (const question of unit.data.questions) {
        delete question.content;
        if (question.answerOptions === undefined) continue;
        for (const option of question.answerOptions) {
          delete option.content;
        }
      }
    }
    unit.id = this.key;
    this.props = unit;
    Object.assign(this, unit);
    return this;
  }

  async getSubsection(db) {
    if (this._subsection === undefined)
      this._subsection = await Cache.find('subsections', this.subsectionId, db);
    return this._subsection;
  }

  async getCourse(db) {
    const subsection = await this.getSubsection(db);
    const course = await subsection.getCourse(db);
    return course;
  }

  async isAccessible() {
    return await this.getSubsection()
    |> #.isAccessible();
  }
}

