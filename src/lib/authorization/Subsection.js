import { CachedValue, Cache } from './Caching';

class Subsection extends CachedValue {

  async resolve(db) {
    await db.query(`
      SELECT
        access_date AS accessDate,
        expiration_date AS expirationDate,
        (SELECT course_id FROM course_delivery_sections WHERE id = section_id) AS courseId
      FROM course_delivery_subsections
      WHERE id = ${this.id}
    `) |> Object.assign(this, #);
  }

  async getCourse() {
    if (this._course === undefined)
      this._course = await Cache.find('courses', this.courseId);
    return this._course;
  }

  isAccessible() {
    return this.accessDate >= new Date();
  }

  isExpired() {
    return this.expirationDate < new Date();
  }
}

Cache.createCachedValues('subsections', Subsection);