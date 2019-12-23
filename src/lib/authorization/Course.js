import CachedValue from './CachedValue';

const courses = [];

class Course extends CachedValue {

  constructor(id, db) {
    super(db);
    this.id = id;
  }

  async _obtain(db) {
    const [entry] = await db.query(`
      SELECT
        _name AS name,
        start_date AS startDate,
        enrollemnt_end_date AS enrollmentEndDate,
        price AS price,
        creation_date AS creationDate,
      FROM course_delivery_instances
      WHERE id = ${this.id}
    `);
    this.startDate = entry.startDate;
    this.enrollmentEndDate = entry.enrollmentEndDate;
    this.price = entry.price;
  }
}

export async function getCourse(id, db) {
  let course = courses.find(_course => _course.id === id);

  if (course === undefined) {
    course = new Course(id, db);
    courses.push(course);
  }

  return await course?.obtain();
}