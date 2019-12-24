import { CachedValue, Cache } from './Caching';

class Course extends CachedValue {

  async _obtain(db) {
    await db.query(`
      SELECT
        _name AS name,
        start_date AS startDate,
        enrollemnt_end_date AS enrollmentEndDate,
        price,
        creation_date AS creationDate,
      FROM course_delivery_instances
      WHERE id = ${this.id}
    `) |> Object.assign(this, #);
  }
}

Cache.createCachedValues('subsections', Course);