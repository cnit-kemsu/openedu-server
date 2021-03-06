import { CachedValue, Cache } from './Caching';

export default class Subsection extends CachedValue {

  async resolve(db) {
    const [subsection] = await db.query(`
      SELECT
        access_date AS accessDate,
        expiration_date AS expirationDate,
        (SELECT course_id FROM course_delivery_sections WHERE id = section_id) AS courseId
      FROM course_delivery_subsections
      WHERE id = ${this.key}
    `);
    if (subsection === undefined) return;
    subsection.id = this.key;
    this.props = subsection;
    Object.assign(this, subsection);
    return this;
  }

  async getCourse(db) {
    if (this._course === undefined)
      this._course = await Cache.find('courses', this.courseId, db);
    return this._course;
  }

  isAccessible(db) {
    return this.accessDate == null || this.accessDate >= new Date();
  }

  isExpired(db) {
    return this.expirationDate != null && this.expirationDate < new Date();
  }
}

