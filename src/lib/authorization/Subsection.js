import CachedValue from './CachedValue';

const subsections = [];

class Subsection extends CachedValue {

  constructor(id, db) {
    super(db);
    this.id = id;
  }

  async _obtain(db) {
    const [entry] = await db.query(`
      SELECT
        access_date AS accessDate,
        expiration_date AS expirationDate,
        (SELECT course_id FROM course_delivery_sections WHERE id = section_id) AS courseId
      FROM course_delivery_subsections
      WHERE id = ${this.id}
    `);
    this.accessDate = entry.accessDate;
    this.expirationDate = entry.expirationDate;
    this.courseId = entry.courseId;
  }

  isAccessOpen() {
    return this.accessDate >= new Date();
  }
}

export async function getSubsection(id, db) {
  let subsection = subsections.find(_subsection => _subsection.id === id);

  if (subsection === undefined) {
    subsection = new Subsection(id, db);
    subsections.push(subsection);
  }

  return await subsection?.obtain();
}