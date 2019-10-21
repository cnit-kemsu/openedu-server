// import { types as _, Mapping, Loader, ClientInfo, GraphQLError, collate } from '@kemsu/graphql-server';
// import { authorizeCourseAdmin, resolveTime } from './_shared';
// import { authorizeSectionCourseDTCreator, SectionDesignType } from './courseDesignSections';
// import { UnitDesignType } from './courseDesignUnits';

// const { toColumns, toFilter, toAssignment } = new Mapping({
//   name: '_name',
//   summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
//   sectionId: 'section_id',
//   section: { sectionId: 'section_id' },
//   units: { id: 'id' },
//   accessPeriod: 'access_period',
//   expirationPeriod: 'expiration_period'
// }, {
//   keys: keyArray => `id IN (${keyArray})`,
//   sectionKeys: keyArray => `section_id IN (${keyArray})`
// });

// function design_loadSubsectionsBySectionId(sectionKeys, { db }, info) {
//   const cols = toColumns(info, { sectionId: {} });
//   const [filter, params] = toFilter({ sectionKeys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_subsections ${filter}`,
//     params
//   );
// }

// function design_loadSubsectionById(keys, { db }, info) {
//   const cols = toColumns(info, { id: {} });
//   const [filter, params] = toFilter({ keys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_subsections ${filter}`,
//     params
//   );
// }

// export async function authorizeSubsectionCourseDTCreator(id, db, user) {
//   if (user.role !== 'instructor') return;
//   const [{ creatorId }] = await db.query(`
//     SELECT creator_id creatorId FROM course_design_templates WHERE id = (
//       SELECT course_id FROM course_design_sections WHERE id = (
//         SELECT section_id FROM course_design_subsections WHERE id = ?
//       )
//     )
//   `, id);
//   if (user.id !== creatorId) throw new GraphQLError("You don't have enough permission to perform this operation");
// }

// export const SubsectionDesignType = new _.Object({
//   name: 'SubsectionDesign',
//   fields: () => ({
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     accessPeriod: { type: _.Int },
//     expirationPeriod: { type: _.Int },
//     units: {
//       type: new _.List(UnitDesignType),
//       resolve({ id }, {}, { design_unitsBySubsectionId }, info) {
//         return design_unitsBySubsectionId.load(id, info);
//       }
//     },
//     section: {
//       type: new _.NonNull(SectionDesignType),
//       resolve({ sectionId }, {}, { design_sectionById }, info) {
//         return design_sectionById.load(sectionId, info);
//       }
//     }
//   })
// });

// const createSubsectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     sectionId: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     accessPeriod: { type: _.Int },
//     expirationPeriod: { type: _.Int },
//   },
//   async resolve(obj, { summary, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSectionCourseDTCreator(input.sectionId, db, user);

//     if (input.accessPeriod !== undefined) if (!input.accessPeriod) input.accessPeriod = null;
//     if (input.expirationPeriod !== undefined) if (!input.expirationPeriod) input.expirationPeriod = null;

//     if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];
//     const [assignment, params] = toAssignment(input);
//     try {
//       return await db.query(`INSERT INTO course_design_subsections ${assignment}`, [...params])
//       |> #.insertId;
//     } catch(error) {
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Подраздел с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const updateSubsectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: _.String },
//     summary: { type: _.String },
//     accessPeriod: { type: _.Int },
//     expirationPeriod: { type: _.Int },
//   },
//   async resolve(obj, { id, summary, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSubsectionCourseDTCreator(id, db, user);

//     if (input.accessPeriod !== undefined) if (!input.accessPeriod) input.accessPeriod = null;
//     if (input.expirationPeriod !== undefined) if (!input.expirationPeriod) input.expirationPeriod = null;
    
//     if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
//     const [assignment, params] = toAssignment(input);
//     if (assignment === '') return 0;
//     return await db.query(`UPDATE course_design_subsections ${assignment} WHERE id = ?`, [ ...params, id ])
//     |> #.affectedRows;
//   }
// };

// const deleteSubsectionDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSubsectionCourseDTCreator(id, db, user);

//     return await db.query(`DELETE FROM course_design_subsections WHERE id = ?`, id)
//       |> #.affectedRows;
//   }
// };

// export default [{
// }, {
//   createSubsectionDesign,
//   updateSubsectionDesign,
//   deleteSubsectionDesign
// }, {
//   design_subsectionsBySectionId: new Loader(design_loadSubsectionsBySectionId, collate.filter('sectionId')),
//   design_subsectionById: new Loader(design_loadSubsectionById, collate.find('id'))
// }];