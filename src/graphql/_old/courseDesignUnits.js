// import { types as _, Mapping, Loader, ClientInfo, GraphQLError, collate, authorize } from '@kemsu/graphql-server';
// import { authorizeCourseAdmin } from './_shared';
// import { authorizeSubsectionCourseDTCreator, SubsectionDesignType } from './courseDesignSubsections';
// import { insertFilesOfValue } from '../lib/insertFilesOfValue';

// const { toColumns, toFilter, toAssignment } = new Mapping({
//   name: '_name',
//   summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
//   type: '_type',
//   data: '(SELECT _value FROM _values WHERE _values.id = data_value_id)',
//   subsectionId: 'subsection_id',
//   subsection: { subsectionId: 'subsection_id' }
// }, {
//   keys: keyArray => `id IN (${keyArray})`,
//   subsectionKeys: keyArray => `subsection_id IN (${keyArray})`
// });

// function design_loadUnitsBySubsectionId(subsectionKeys, { db }, info) {
//   const cols = toColumns(info, { subsectionId: {} });
//   const [filter, params] = toFilter({ subsectionKeys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_units ${filter}`,
//     params
//   );
// }

// export async function authorizeUnitCourseDTCreator(id, db, user) {
//   if (user.role !== 'instructor') return;
//   const [{ creatorId }] = await db.query(`
//     SELECT creator_id creatorId FROM course_design_templates WHERE id = (
//       SELECT course_id FROM course_design_sections WHERE id = (
//         SELECT section_id FROM course_design_subsections WHERE id = (
//           SELECT subsection_id FROM course_design_units WHERE id = ?
//         )
//       )
//     )
//   `, id);
//   if (user.id !== creatorId) throw new GraphQLError("You don't have enough permission to perform this operation");
// }

// export const UnitTypeEnumType = new _.EnumType({
//   name: 'UnitTypeEnum',
//   values: {
//     DOCUMENT: { value: 'document' },
//     VIDEO: { value: 'video' },
//     QUIZ: { value: 'quiz' }
//   }
// });

// export const UnitDesignType = new _.Object({
//   name: 'UnitDesign',
//   fields: () => ({
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     type: { type:  new _.NonNull(UnitTypeEnumType) },
//     data: {
//       type: _.JSON,
//       resolve({ data }) {
//         return JSON.parse(data);
//       }
//     },
//     subsection: {
//       type: new _.NonNull(SubsectionDesignType),
//       resolve({ subsectionId }, {}, { design_subsectionById }, info) {
//         return design_subsectionById.load(subsectionId, info);
//       }
//     }
//   })
// });

// const unitDesign = {
//   type: UnitDesignType,
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { db, user }, info) {
//     authorize(user);

//     const cols = toColumns(info);
//     return await db.query(`SELECT ${cols} FROM course_design_units WHERE id = ?`, id)
//     |> #[0];
//   }
// };

// const createUnitDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     subsectionId: { type: new _.NonNull(_.Int) },
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     type: { type:  new _.NonNull(UnitTypeEnumType) },
//     data: { type: _.JSON }
//   },
//   async resolve(obj, { summary, data, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeSubsectionCourseDTCreator(input.subsectionId, db, user);

//     if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];

//     try {
//       await db.beginTransaction();

//       if (data !== undefined) {
//         if (!data.totalAttempts) delete data.totalAttempts;
//         if (!data.timeLimit) delete data.timeLimit;
//         const fileIdArray = await insertFilesOfValue(db, data);
//         input.data = [`create_value(?, '${fileIdArray}')`, JSON.stringify(data)];
//       }
//       const [assignment, params] = toAssignment(input);

//       const { insertId } = await db.query(`INSERT INTO course_design_units ${assignment}`, [...params]);
//       await db.commit();
//       return insertId;

//     } catch(error) {
//       await db.rollback();
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Блок с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const updateUnitDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: _.String },
//     summary: { type: _.String },
//     type: { type: UnitTypeEnumType },
//     data: { type: _.JSON }
//   },
//   async resolve(obj, { id, summary, data, ...input }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeUnitCourseDTCreator(id, db, user);

//     if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
//     try {
//       await db.beginTransaction();

//       if (data !== undefined) {
//         if (!data.totalAttempts) delete data.totalAttempts;
//         if (!data.timeLimit) delete data.timeLimit;
//         const fileIdArray = await insertFilesOfValue(db, data);
//         input.data_value_id = [`update_value(data_value_id, ?, '${fileIdArray}')`, JSON.stringify(data)];
//       }
//       const [assignment, params] = toAssignment(input);
//       if (assignment === '') {
//         await db.rollback();
//         return 0;
//       }

//       const { affectedRows } = await db.query(`UPDATE course_design_units ${assignment} WHERE id = ?`, [ ...params, id ]);
//       await db.commit();
//       return affectedRows;

//     } catch(error) {
//       await db.rollback();
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Блок с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const deleteUnitDesign = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { db, user }) {
//     authorizeCourseAdmin(user);
//     await authorizeUnitCourseDTCreator(id, db, user);

//     return await db.query(`DELETE FROM course_design_units WHERE id = ?`, id)
//       |> #.affectedRows;
//   }
// };

// export default [{
//   unitDesign
// }, {
//   createUnitDesign,
//   updateUnitDesign,
//   deleteUnitDesign
// }, {
//   design_unitsBySubsectionId: new Loader(design_loadUnitsBySubsectionId, collate.filter('subsectionId'))
// }];