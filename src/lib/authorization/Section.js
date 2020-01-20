import { CachedValue, Cache } from './Caching';

export default class Section extends CachedValue {

  async resolve(db) {
    const [section] = await db.query(`
      SELECT course_id AS courseId
      FROM course_delivery_sections
      WHERE id = ${this.key}
    `);
    if (section === undefined) return;
    section.id = this.key;
    this.props = section;
    Object.assign(this, section);
    return this;
  }

  async getCourse(db) {
    if (this._course === undefined)
      this._course = await Cache.find('courses', this.courseId, db);
    return this._course;
  }
}

