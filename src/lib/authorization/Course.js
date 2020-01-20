import { CachedValue } from './Caching';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';

function toIdArray({ id }) {
  return id;
}

function assignPrevNextEntities(sections) {

  let previousSubsection = { id: null };
  for (const section of sections) {
    for (const subsection of section.subsections) {
      subsection.section = section;
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
        unit.subsection = subsection;
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
        sequence_number
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
    }
    for (const subsection of subsections) {
      subsection.units = units
        .filter(({ subsectionId }) => subsectionId === subsection.id)
        .sort(sortBySequenceNumber);
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
    const subsection = unit1.subsection;
    const index1 = subsection.units.findIndex(({ id }) => id === key1);
    subsection.units.splice(index1, 1);
    
    if (key2 != null) {
      const index2 = subsection.units.findIndex(({ id }) => id === key2);
      subsection.units.splice(index2, 0, unit1);
    } else subsection.units.push(unit1);

    assignPrevNextEntities(this.sections);
  }

  swapSubsections(key1, key2) {

    const subsection1 = this.subsections.find(({ id }) => id === key1);
    const section = subsection1.section;
    const index1 = section.subsections.findIndex(({ id }) => id === key1);
    section.subsections.splice(index1, 1);
    
    if (key2 != null) {
      const index2 = section.subsections.findIndex(({ id }) => id === key2);
      section.subsections.splice(index2, 0, subsection1);
    } else section.subsections.push(subsection1);

    assignPrevNextEntities(this.sections);
  }

  swapSections(key1, key2) {

    const section1 = this.sections.find(({ id }) => id === key1);
    const index1 = this.sections.findIndex(({ id }) => id === key1);
    this.sections.splice(index1, 1);
    
    if (key2 != null) {
      const index2 = this.sections.findIndex(({ id }) => id === key2);
      this.sections.splice(index2, 0, section1);
    } else this.sections.push(section1);

    assignPrevNextEntities(this.sections);
  }
}

