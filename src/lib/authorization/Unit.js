import { CachedValue, Cache } from './Caching';

class Unit extends CachedValue {

  async resolve(db) {
    await db.query(`
      SELECT
        subsection_id AS subsectionId,
        _type AS type,
        IF(_type = 'quiz', get_value(data_value_id), NULL) data
      FROM course_delivery_units
      WHERE id = ${this.id}
    `) |> Object.assign(this, #);
    if (this.data !== null) this.data = JSON.parse(this.data);
  }

  async getSubsection() {
    if (this._subsection === undefined)
      this._subsection = await Cache.find('subsections', this.subsectionId);
    return this._subsection;
  }

  async isAccessible() {
    return await this.getSubsection()
    |> #.accessDate >= new Date();
  }
}

Cache.createCachedValues('units', Unit);