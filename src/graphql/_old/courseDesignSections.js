// import { types as _, Mapping, Loader, ClientInfo, GraphQLError, collate } from '@kemsu/graphql-server';
// import { authorizeCourseAdmin } from './_shared';
// import { authorizeCourseDTCreator, CourseDesignTemplateType } from './courseDesignTemplates';
// import { SubsectionDesignType } from './courseDesignSubsections';

// const { toColumns, toFilter, toAssignment } = new Mapping({
//   name: '_name',
//   summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
//   courseId: 'course_id',
//   course: { courseId: 'course_id' },
//   subsections: { id: 'id' }
// }, {
//   keys: keyArray => `id IN (${keyArray})`,
//   courseKeys: keyArray => `course_id IN (${keyArray})`
// });

// function design_loadSectionsByCourseId(courseKeys, { db }, info) {
//   const cols = toColumns(info, { courseId: {} });
//   const [filter, params] = toFilter({ courseKeys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_sections ${filter}`,
//     params
//   );
// }

// function design_loadSectionById(keys, { db }, info) {
//   const cols = toColumns(info, { id: {} });
//   const [filter, params] = toFilter({ keys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_sections ${filter}`,
//     params
//   );
// }

// export async function authorizeSectionCourseDTCreator(id, db, user) {
//   if (user.role !== 'instructor') return;
//   const [{ creatorId }] = await db.query(`
//     SELECT creator_id creatorId FROM course_design_templates WHERE id = (
//       SELECT course_id FROM course_design_sections WHERE id = ?
//     )
//   `, id);
//   if (user.id !== creatorId) throw new GraphQLError("You don't have enough permission to perform this operation");
// }

// export const SectionDesignType = new _.Object({
//   name: 'SectionDesign',
//   fields: () => ({
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     subsections: {
//       type: new _.List(SubsectionDesignType),
//       resolve({ id }, {}, { design_subsectionsBySectionId }, info) {
//         return design_subsectionsBySectionId.load(id, info);
//       }
//     },
//     course: {
//       type: new _.NonNull(CourseDesignTemplateType),
//       resolve({ courseId }, {}, { design_courseById }, info) {
//         return design_courseById.load(courseId, info);
//       }
//     }
//   })
// });

// const createSectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     courseId: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String }
//   },
//   async resolve(obj, { summary, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeCourseDTCreator(input.courseId, db, user);

//     if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];
//     const [assignment, params] = toAssignment(input);
//     try {
//       return await db.query(`INSERT INTO course_design_sections ${assignment}`, [...params])
//       |> #.insertId;
//     } catch(error) {
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Раздел с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const updateSectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: _.String },
//     summary: { type: _.String }
//   },
//   async resolve(obj, { id, summary, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSectionCourseDTCreator(id, db, user);

//     if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
//     const [assignment, params] = toAssignment(input);
//     if (assignment === '') return 0;
//     return await db.query(`UPDATE course_design_sections ${assignment} WHERE id = ?`, [ ...params, id ])
//     |> #.affectedRows;
//   }
// };

// const deleteSectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSectionCourseDTCreator(id, db, user);

//     return await db.query(`DELETE FROM course_design_sections WHERE id = ?`, id)
//       |> #.affectedRows;
//   }
// };

// export default [{
// }, {
//   createSectionDesign,
//   updateSectionDesign,
//   deleteSectionDesign
// }, {
//   design_sectionsByCourseId: new Loader(design_loadSectionsByCourseId, collate.filter('courseId')),
//   design_sectionById: new Loader(design_loadSectionById, collate.find('id'))
// }];