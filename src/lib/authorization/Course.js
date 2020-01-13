import { CachedValue } from './Caching';
import { sortBySequenceNumber } from '@lib/sortBySequenceNumber';

function toIdArray({ id }) {
  return id;
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

    let previousSubsection = { id: null };
    for (const section of sections) {
      for (const subsection of section.subsections) {
        subsection.previousSubsectionId = previousSubsection.id;
        previousSubsection.nextSubsectionId = subsection.id;
        previousSubsection = subsection;
      }
    }

    let previousUnit = { id: null };
    for (const section of sections) {
      for (const subsection of section.subsections) {
        for (const unit of subsection.units) {
          unit.previousUnitId = previousUnit.id;
          previousUnit.nextUnitId = unit.id;
          previousUnit = unit;
        }
      }
    }

    course.subsections = subsections;
    course.units = units;
    this.props = course;
    Object.assign(this, course);
    return this;
  }
}

