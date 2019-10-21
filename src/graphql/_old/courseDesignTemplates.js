// import { types as _, resolveJSON, Mapping, ClientInfo, GraphQLError, Loader, collate } from '@kemsu/graphql-server';
// import { authorizeCourseAdmin } from './_shared';
// import { SectionDesignType } from './courseDesignSections';
// import { insertFilesOfValue } from '../lib/insertFilesOfValue';
// import { authorizeAdmin, authorizeSuperuser } from '../lib/authorization';

// const { toColumns, toFilter, toAssignment } = new Mapping({
//   name: '_name',
//   summary: 'get_value(summary_value_id)',
//   description: 'get_value(description_value_id)',
//   picture: 'get_value(picture_value_id)',
//   creatorId: 'creator_id',
//   sections: { id: 'id' }
// }, {
//   keys(keyArray) {
//     return `id IN (${keyArray})`;
//   },
//   name: 'name LIKE ?'
// });

// export async function authorizeCreator({ id: userId }, courseId, db) {
//   const [{ role, creatorId }] = await db.query(`SELECT get_user_role(?) role, get_course_design_template_creator_id(?) creatorId;`, [userId, courseId]);
//   if (role === 'superuser') return;
//   if (role === 'admin') {
//     if (userId === creatorId) return;
//     throw new GraphQLError("You are not authorized to perform the action", ClientInfo.PERMISSION_DENIED);
//   }
//   if (role === 'unauthorized') throw new GraphQLError("Invalid user", ClientInfo.PERMISSION_DENIED);
//   throw new GraphQLError("You do not have permission to perform the action", ClientInfo.PERMISSION_DENIED);
// }

// function design_loadCourseById(keys, { db }, info) {
//   const cols = toColumns(info, { id: {} });
//   const [filter, params] = toFilter({ keys });
//   return db.query(
//     `SELECT ${cols} FROM course_design_templates ${filter}`,
//     params
//   );
// }

// export const CourseDesignTemplateType = _.Object({
//   name: 'CourseDesignTemplate',
//   fields: {
//     id: { type: _.NonNull(_.Int) },
//     name: { type: _.NonNull(_.String) },
//     summary: { type: _.String },
//     description: { type: _.JSON, resolve: ({ description }) => resolveJSON(description) },
//     picture: { type: _.JSON, resolve: ({ picture }) => resolveJSON(picture) },
//     creatorId: { type: _.NonNull(_.Int) },
//     sections: {
//       type: _.List(SectionDesignType),
//       resolve({ id }, {}, { design_sectionsByCourseId }, info) {
//         return design_sectionsByCourseId.load(id, info);
//       }
//     },
//   }
// });

// const searchArgs = {
//   keys: { type: _.List(_.Int) },
//   name: { type: _.String }
// };

// const allCourseDesignTemplates = {
//   type: _.List(CourseDesignTemplateType),
//   args: {
//     limit: { type: _.Int },
//     offset: { type: _.Int },
//     ...searchArgs
//   },
//   resolve(obj, { limit = 10, offset = 0, ...search }, { user, db }, info) {
//     authorizeAdmin(user, db);

//     const cols = toColumns(info);
//     const [filter, params] = toFilter(search);
//     return db.query(`SELECT ${cols} FROM course_design_templates ${filter} LIMIT ? OFFSET ?`, [...params, limit, offset]);
//   }
// };

// const totalCourseDesignTemplates = {
//   type: new _.NonNull(_.Int),
//   args: searchArgs,
//   async resolve(obj, search, { user, db }) {
//     authorizeAdmin(user, db);

//     const [filter, params] = toFilter(search);
//     return await db.query(`SELECT COUNT(*) count FROM course_design_templates ${filter}`, params)
//     |> #[0].count;
//   }
// };

// const courseDesignTemplate = {
//   type: CourseDesignTemplateType,
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { user, db }, info) {
//     await authorizeCreator(user, id, db);

//     const cols = toColumns(info);
//     const res = await db.query(`SELECT ${cols} FROM course_design_templates WHERE id = ?`, id)
//     |> #[0];
//     return res;
//   }
// };

// const createCourseDesignTemplate = {
//   type: new _.NonNull(_.Int),
//   args: {
//     name: { type: new _.NonNull(_.String) },
//     summary: { type: _.String },
//     description: { type: _.JSON },
//     picture: { type: _.JSON },
//     defaultPrice: { type: _.Float }
//   },
//   async resolve(obj, { summary, description, picture, ...input }, { user, db }) {
//     authorizeAdmin(user, db);

//     if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];
//     try {
//       await db.beginTransaction();

//       if (picture !== undefined) {
//         const fileId = await insertFilesOfValue(db, picture);
//         input.picture_value_id = [`create_value(?, '${fileId}')`, picture];
//       }

//       if (description !== undefined) {
//         const fileIdArray = await insertFilesOfValue(db, description);
//         input.description_value_id = [`create_value(?, '${fileIdArray}')`, JSON.stringify(description)];
//       }
//       const [assignment, params] = toAssignment(input);

//       const { insertId } = await db.query(`INSERT INTO course_design_templates ${assignment}, creator_id = ?`, [...params, user.id]);
//       await db.commit();
//       return insertId;

//     } catch(error) {
//       await db.rollback();
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Курс с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }
//   }
// };

// const updateCourseDesignTemplate = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) },
//     name: { type: _.String },
//     summary: { type: _.String },
//     description: { type: _.JSON },
//     picture: { type: _.JSON },
//     defaultPrice: { type: _.Float }
//   },
//   async resolve(obj, { id, summary, description, picture, ...input }, { user, db }) {
//     await authorizeCreator(user, id, db);

//     if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
//     try {
//       await db.beginTransaction();

//       if (picture !== undefined) {
//         const fileId = await insertFilesOfValue(db, picture);
//         input.picture_value_id = [`update_value(picture_value_id, ?, '${fileId}')`, picture];
//       }

//       if (description !== undefined) {
//         const fileIdArray = await insertFilesOfValue(db, description);
//         input.description_value_id = [`update_value(description_value_id, ?, '${fileIdArray}')`, JSON.stringify(description)];
//       }
//       const [assignment, params] = toAssignment(input);
//       if (assignment === '') {
//         await db.rollback();
//         return 0;
//       }

//       const { affectedRows } = await db.query(`UPDATE course_design_templates ${assignment} WHERE id = ?`, [...params, id]);
//       await db.commit();
//       return affectedRows;

//     } catch(error) {
//       await db.rollback();
//       if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
//         `Курс с названием '${input.name}' уже существует`,
//         ClientInfo.UNMET_CONSTRAINT
//       );
//       throw error;
//     }

//   }
// };

// const defunctCourseDesignTemplate = {
//   type: _.NonNull(_.Int),
//   args: {
//     id: { type: _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { user, db }) {
//     await authorizeCreator(user, id, db);

//     const { affectedRows } = await db.query(`UPDATE course_design_templates SET defunct = 1 WHERE id = ?`, id);
//     return affectedRows;
//   }
// };

// const deleteCourseDesignTemplate = {
//   type: _.NonNull(_.Int),
//   args: {
//     id: { type: _.NonNull(_.Int) }
//   },
//   async resolve(obj, { id }, { user, db }) {
//     await authorizeSuperuser(user, db);

//     const { affectedRows } = await db.query(`DELETE FROM course_design_templates WHERE id = ?`, id);
//     return affectedRows;
//   }
// };

// export default [{
//   allCourseDesignTemplates,
//   totalCourseDesignTemplates,
//   courseDesignTemplate
// }, {
//   createCourseDesignTemplate,
//   updateCourseDesignTemplate,
//   defunctCourseDesignTemplate,
//   deleteCourseDesignTemplate
// }, {
//   design_courseById: new Loader(design_loadCourseById, collate.find('id'))
// }];
