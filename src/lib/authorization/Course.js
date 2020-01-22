import { CachedValue } from './Caching';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';

function toIdArray({ id }) {
  return id;
}

function assignPrevNextEntities(sections) {

  let previousSubsection = { id: null };
  for (const section of sections) {
    for (const subsection of section.subsections) {
      if (subsection.units.length  === 0) continue;
      subsection.previousSubsectionId = previousSubsection.id;
      subsection.nextSubsectionId = null;
      previousSubsection.nextSubsectionId = subsection.id;
      previousSubsection = subsection;
    }
  }

  let previousUnit = { id: null };
  for (const section of sections) {
    for (const subsection of section.subsections) {
      for (const unit of subsection.units) {
        unit.previousUnitId = previousUnit.id;
        unit.nextUnitId = null;
        previousUnit.nextUnitId = unit.id;
        previousUnit = unit;
      }
    }
  }
}

export default class Course extends CachedValue {

  async resolve(db) {
    const [course] = await db.query(`
      SELECT
        _name AS name,
        start_date AS startDate,
        enrollment_end_date AS enrollmentEndDate,
        price,
        creation_date AS creationDate
      FROM course_delivery_instances
      WHERE id = ${this.key}
    `);
    
    if (course === undefined) return;
    course.id = this.key;

    let sections = await db.query(`
      SELECT
        id,
        sequence_number sequenceNumber
      FROM course_delivery_sections
      WHERE course_id = ${course.id}
    `);
    const subsections = await db.query(`
      SELECT
        id,
        sequence_number sequenceNumber,
        section_id sectionId
      FROM course_delivery_subsections
      WHERE section_id IN (${sections.map(toIdArray).join(', ')})
    `);
    const units = await db.query(`
      SELECT
        id,
        sequence_number sequenceNumber,
        subsection_id subsectionId
      FROM course_delivery_units
      WHERE subsection_id IN (${subsections.map(toIdArray).join(', ')})
    `);

    sections = sections.sort(sortBySequenceNumber);
    for (const section of sections) {
      section.subsections = subsections
        .filter(({ sectionId }) => sectionId === section.id)
        .sort(sortBySequenceNumber);
      section.subsections.forEach(subsection => { subsection.section = section; });
    }
    for (const subsection of subsections) {
      subsection.units = units
        .filter(({ subsectionId }) => subsectionId === subsection.id)
        .sort(sortBySequenceNumber);
      subsection.units.forEach(unit => { unit.subsection = subsection; });
    }

    assignPrevNextEntities(sections);

    course.sections = sections;
    course.subsections = subsections;
    course.units = units;
    this.props = course;
    Object.assign(this, course);
    return this;
  }

  swapUnits(key1, key2) {
    const unit1 = this.units.find(({ id }) => id === key1);
    const units = unit1.subsection.units;
    const index1 = units.indexOf(unit1);
    units.splice(index1, 1);
    
    const index2 = key2 != null ? units.findIndex(({ id }) => id === key2) : units.length;
    units.splice(index2, 0, unit1);

    assignPrevNextEntities(this.sections);
  }

  addUnit(key, subsectionKey) {
    const subsection = this.subsections.find(({ id }) => id === subsectionKey);
    const unit = { id: key, subsection };

    subsection.units.push(unit);
    this.units.push(unit);

    assignPrevNextEntities(this.sections);
  }

  removeUnit(key) {
    const unit = this.units.find(({ id }) => id === key);
    const units = unit.subsection.units;

    units.splice(units.indexOf(unit), 1);
    this.units.splice(this.units.indexOf(unit), 1);

    assignPrevNextEntities(this.sections);
  }

  swapSubsections(key1, key2) {
    const subsection1 = this.subsections.find(({ id }) => id === key1);
    const subsections = subsection1.section.subsections;
    const index1 = subsections.indexOf(subsection1);
    subsections.splice(index1, 1);
    
    const index2 = key2 != null ? subsections.findIndex(({ id }) => id === key2) : subsections.length;
    subsections.splice(index2, 0, subsection1);

    assignPrevNextEntities(this.sections);
  }

  addSubsection(key, sectionKey) {
    const section = this.sections.find(({ id }) => id === sectionKey);
    const subsection = { id: key, section, units: [] };

    section.subsections.push(subsection);
    this.subsections.push(subsection);

    assignPrevNextEntities(this.sections);
  }

  removeSubsection(key) {
    const subsection = this.subsections.find(({ id }) => id === key);
    const subsections = subsection.section.subsections;

    subsections.splice(subsections.indexOf(subsection), 1);
    this.subsections.splice(this.subsections.indexOf(subsection), 1);

    for (const unit of subsection.units) this.units.splice(this.units.indexOf(unit), 1);

    assignPrevNextEntities(this.sections);
  }

  swapSections(key1, key2) {
    const index1 = this.sections.findIndex(({ id }) => id === key1);
    const [section1] = this.sections.splice(index1, 1);
    
    const index2 = key2 != null ? this.sections.findIndex(({ id }) => id === key2) : this.sections.length;
    this.sections.splice(index2 , 0, section1);

    assignPrevNextEntities(this.sections);
  }

  addSection(key) {
    this.sections.push({ id: key, subsections: [] });

    assignPrevNextEntities(this.sections);
  }

  removeSection(key) {
    const index = this.sections.findIndex(({ id }) => id === key);
    const [{ subsections }] = this.sections.splice(index, 1);

    for (const subsection of subsections) this.subsections.splice(this.subsections.indexOf(subsection), 1);

    assignPrevNextEntities(this.sections);
  }
}

