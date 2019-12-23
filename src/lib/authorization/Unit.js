import CachedValue from './CachedValue';
import { getSubsection } from './Subsection';

const units = [];

class Unit extends CachedValue {

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

export async function getUnit(id, db) {
  let unit = units.find(_unit => _unit.id === id);

  if (unit === undefined) {
    unit = new Unit(id, db);
    units.push(unit);
  }

  return await unit?.obtain();
}