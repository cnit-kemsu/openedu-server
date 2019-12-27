import { CachedValue, Cache } from './Caching';

export default class Course extends CachedValue {

  async _obtain(db) {
    const [course] = await db.query(`
      SELECT
        _name AS name,
        start_date AS startDate,
        enrollemnt_end_date AS enrollmentEndDate,
        price,
        creation_date AS creationDate,
      FROM course_delivery_instances
      WHERE id = ${this.key}
    `);
    if (course === undefined) return;
    course.id = this.key;
    this.props = course;
    Object.assign(this, course);
    return this;
  }
}

