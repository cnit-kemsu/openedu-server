import { Loader, collation } from '@kemsu/graphql-server';

import allCourseDeliveryInstances from './course/allCourses';
import totalCourseDeliveryInstances from './course/totalCourses';
import courseDeliveryInstance from './course/course';
import createCourseDeliveryInstance from './course/createCourse';
import updateCourseDeliveryInstance from './course/updateCourse';
import defunctCourseDeliveryInstance from './course/defunctCourse';
import deleteCourseDeliveryInstance from './course/deleteCourse';
import sendSertificate from './course/sendSertificate';
import courseLoaders from './course/_loaders';

import courseDeliveryInstanceUserProgress from './course/courseDeliveryInstanceUserProgress';
import courseDeliveryStudents from './course/courseDeliveryStudents';
import enrollInCourse from './course/enrollInCourse';

import createCourseDeliverySection from './section/createSection';
import updateCourseDeliverySection from './section/updateSection';
import deleteCourseDeliverySection from './section/deleteSection';
import sectionLoaders from './section/_loaders';

import courseDeliverySubsection from './subsection/subsection';
import createCourseDeliverySubsection from './subsection/createSubsection';
import updateCourseDeliverySubsection from './subsection/updateSubsection';
import deleteCourseDeliverySubsection from './subsection/deleteSubsection';
import subsectionLoaders from './subsection/_loaders';

import courseDeliveryUnit from './unit/unit';
import createCourseDeliveryUnit from './unit/createUnit';
import updateCourseDeliveryUnit from './unit/updateUnit';
import deleteCourseDeliveryUnit from './unit/deleteUnit';
import moveCourseDeliveryUnit from './unit/moveUnit';
import unitLoaders from './unit/_loaders';

export default {
  query: {
    allCourseDeliveryInstances,
    totalCourseDeliveryInstances,
    courseDeliveryInstance,

    courseDeliverySubsection,
    courseDeliveryUnit,

    courseDeliveryInstanceUserProgress,
    courseDeliveryStudents
  },
  mutation: {
    createCourseDeliveryInstance,
    updateCourseDeliveryInstance,
    defunctCourseDeliveryInstance,
    deleteCourseDeliveryInstance,
    sendSertificate,

    createCourseDeliverySection,
    updateCourseDeliverySection,
    deleteCourseDeliverySection,

    createCourseDeliverySubsection,
    updateCourseDeliverySubsection,
    deleteCourseDeliverySubsection,

    createCourseDeliveryUnit,
    updateCourseDeliveryUnit,
    deleteCourseDeliveryUnit,
    moveCourseDeliveryUnit,

    enrollInCourse
  },
  loaders: {
    courseDelivery_instance_byId: new Loader(courseLoaders.byId, collation.find('id')),
    courseDelivery_section_byId: new Loader(sectionLoaders.byId, collation.find('id')),
    courseDelivery_section_byCourseId: new Loader(sectionLoaders.byCourseId, collation.filter('courseId')),
    courseDelivery_subsection_byId: new Loader(subsectionLoaders.byId, collation.find('id')),
    courseDelivery_subsection_bySectionId: new Loader(subsectionLoaders.bySectionId, collation.filter('sectionId')),
    courseDelivery_unit_byId: new Loader(unitLoaders.byId, collation.find('id')),
    courseDelivery_unit_bySubsectionId: new Loader(unitLoaders.bySubsectionId, collation.filter('subsectionId'))
  }
};