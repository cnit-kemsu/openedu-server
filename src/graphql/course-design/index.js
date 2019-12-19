import { Loader, collation } from '@kemsu/graphql-server';

import allCourseDesignTemplates from './course/allCourses';
import totalCourseDesignTemplates from './course/totalCourses';
import courseDesignTemplate from './course/course';
import createCourseDesignTemplate from './course/createCourse';
import updateCourseDesignTemplate from './course/updateCourse';
import defunctCourseDesignTemplate from './course/defunctCourse';
import deleteCourseDesignTemplate from './course/deleteCourse';
import courseLoaders from './course/_loaders';

import createCourseDesignSection from './section/createSection';
import updateCourseDesignSection from './section/updateSection';
import deleteCourseDesignSection from './section/deleteSection';
import moveCourseDesignSection from './unit/moveSection';
import sectionLoaders from './section/_loaders';

import createCourseDesignSubsection from './subsection/createSubsection';
import updateCourseDesignSubsection from './subsection/updateSubsection';
import deleteCourseDesignSubsection from './subsection/deleteSubsection';
import moveCourseDesignSubsection from './unit/moveSubsection';
import subsectionLoaders from './subsection/_loaders';

import courseDesignUnit from './unit/unit';
import createCourseDesignUnit from './unit/createUnit';
import updateCourseDesignUnit from './unit/updateUnit';
import deleteCourseDesignUnit from './unit/deleteUnit';
import moveCourseDesignUnit from './unit/moveUnit';
import unitLoaders from './unit/_loaders';

export default {
  query: {
    allCourseDesignTemplates,
    totalCourseDesignTemplates,
    courseDesignTemplate,

    courseDesignUnit
  },
  mutation: {
    createCourseDesignTemplate,
    updateCourseDesignTemplate,
    defunctCourseDesignTemplate,
    deleteCourseDesignTemplate,

    createCourseDesignSection,
    updateCourseDesignSection,
    deleteCourseDesignSection,
    moveCourseDesignSection,

    createCourseDesignSubsection,
    updateCourseDesignSubsection,
    deleteCourseDesignSubsection,
    moveCourseDesignSubsection,

    createCourseDesignUnit,
    updateCourseDesignUnit,
    deleteCourseDesignUnit,
    moveCourseDesignUnit
  },
  loaders: {
    courseDesign_template_byId: new Loader(courseLoaders.byId, collation.find('id')),
    courseDesign_section_byId: new Loader(sectionLoaders.byId, collation.find('id')),
    courseDesign_section_byCourseId: new Loader(sectionLoaders.byCourseId, collation.filter('courseId')),
    courseDesign_subsection_byId: new Loader(subsectionLoaders.byId, collation.find('id')),
    courseDesign_subsection_bySectionId: new Loader(subsectionLoaders.bySectionId, collation.filter('sectionId')),
    courseDesign_unit_byId: new Loader(unitLoaders.byId, collation.find('id')),
    courseDesign_unit_bySubsectionId: new Loader(unitLoaders.bySubsectionId, collation.filter('subsectionId'))
  }
};