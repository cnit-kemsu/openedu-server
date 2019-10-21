import { types as _, Mapping, Loader, ClientInfo, GraphQLError, collate, authorize } from '@kemsu/graphql-server';
import { authorizeCourseAdmin } from './_shared';
import { authorizeSubsectionCourseDICreator, SubsectionDeliveryType } from './courseDeliverySubsections';
import { UnitTypeEnumType } from './_old/courseDesignUnits';
import { insertFilesOfValue } from '../lib/insertFilesOfValue';
import { getQuizAttempt } from './quiz';

const { toColumns, toFilter, toAssignment } = new Mapping({
  name: '_name',
  summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
  type: '_type',
  data: '(SELECT _value FROM _values WHERE _values.id = data_value_id)',
  subsectionId: 'subsection_id',
  subsection: { subsectionId: 'subsection_id' }
}, {
  keys: keyArray => `id IN (${keyArray})`,
  subsectionKeys: keyArray => `subsection_id IN (${keyArray})`
});

function delivery_loadUnitsBySubsectionId(subsectionKeys, { db }, info) {
  const cols = toColumns(info, { subsectionId: {} });
  const [filter, params] = toFilter({ subsectionKeys });
  return db.query(
    `SELECT ${cols} FROM course_delivery_units ${filter}`,
    params
  );
}

export async function authorizeUnitCourseDICreator(id, db, user) {
  if (user.role !== 'instructor') return;
  const [{ creatorId }] = await db.query(`
    SELECT creator_id creatorId FROM course_delivery_instances WHERE id = (
      SELECT course_id FROM course_delivery_sections WHERE id = (
        SELECT section_id FROM course_delivery_subsections WHERE id = (
          SELECT subsection_id FROM course_delivery_units WHERE id = ?
        )
      )
    )
  `, id);
  if (user.id !== creatorId) throw new GraphQLError("You don't have enough permission to perform this operation");
}

async function authorizeUnitCourseEnrollment(id, db, user) {
  if (user.role !== 'student') return;
  const [{ enrolled } = {}] = await db.query(`
    SELECT 1 enrolled FROM enrollments WHERE user_id = ? AND course_id = (
      SELECT course_id FROM course_delivery_sections WHERE id = (
        SELECT section_id FROM course_delivery_subsections WHERE id = (
          SELECT subsection_id FROM course_delivery_units WHERE id = ?
        )
      )
    )
  `, [user.id, id]);
  if (enrolled !== 1) throw new GraphQLError("You must to be enrolled to course to have access to it's units");
}


export const UnitDeliveryType = new _.Object({
  name: 'UnitDelivery',
  fields: () => ({
    id: { type: new _.NonNull(_.Int) },
    name: { type: new _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type:  new _.NonNull(UnitTypeEnumType) },
    data: {
      type: _.JSON,
      resolve({ data }) {
        return JSON.parse(data);
      }
    },
    subsection: {
      type: new _.NonNull(SubsectionDeliveryType),
      resolve({ subsectionId }, {}, { delivery_subsectionById }, info) {
        return delivery_subsectionById.load(subsectionId, info);
      }
    }
  })
});

const unitDelivery = {
  type: UnitDeliveryType,
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }, info) {
    authorize(user);
    await authorizeUnitCourseEnrollment(id, db, user);

    const [subsection] = await db.query(`
      SELECT access_date accessDate, expiration_date expirationDate FROM course_delivery_subsections WHERE id = (
        SELECT subsection_id FROM course_delivery_units WHERE id = ?
      )
    `, id);
    if (subsection) {
      const nowDate = new Date();
      if (subsection.accessDate && subsection.accessDate > nowDate) throw new GraphQLError("Unit subsection access not started");
      if (subsection.expirationDate && subsection.expirationDate < nowDate) throw new GraphQLError("Unit subsection access time expired");
    }

    const cols = toColumns(info, { id: {}, type: {} });
    const [unit] = await db.query(`SELECT ${cols} FROM course_delivery_units WHERE id = ?`, id);
    if (unit.data && unit.type === 'quiz' && user.role === 'student') {
      const __data = JSON.parse(unit.data);
      if (__data) delete __data.questions;
      const _data = await getQuizAttempt(db, unit.id, user.id);
      unit.data = { ...__data, ..._data };
      if (unit.data) unit.data = JSON.stringify(unit.data);
    }

    return unit;
  }
};

const createUnitDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    subsectionId: { type: new _.NonNull(_.Int) },
    name: { type: new _.NonNull(_.String) },
    summary: { type: _.String },
    type: { type:  new _.NonNull(UnitTypeEnumType) },
    data: { type: _.JSON }
  },
  async resolve(obj, { summary, data, ...input }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeSubsectionCourseDICreator(input.subsectionId, db, user);

    if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];

    try {
      await db.beginTransaction();

      if (data !== undefined) {
        if (!data.totalAttempts) delete data.totalAttempts;
        if (!data.timeLimit) delete data.timeLimit;
        const fileIdArray = await insertFilesOfValue(db, data);
        input.data = [`create_value(?, '${fileIdArray}')`, JSON.stringify(data)];
      }
      const [assignment, params] = toAssignment(input);

      const { insertId } = await db.query(`INSERT INTO course_delivery_units ${assignment}`, [...params]);
      await db.commit();
      return insertId;

    } catch(error) {
      await db.rollback();
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Блок с названием '${input.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
    }
  }
};

const updateUnitDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String },
    type: { type: UnitTypeEnumType },
    data: { type: _.JSON }
  },
  async resolve(obj, { id, summary, data, ...input }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeUnitCourseDICreator(id, db, user);

    if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
    try {
      await db.beginTransaction();

      if (data !== undefined) {
        if (!data.totalAttempts) delete data.totalAttempts;
        if (!data.timeLimit) delete data.timeLimit;
        const fileIdArray = await insertFilesOfValue(db, data);
        input.data_value_id = [`update_value(data_value_id, ?, '${fileIdArray}')`, JSON.stringify(data)];
      }
      const [assignment, params] = toAssignment(input);
      if (assignment === '') {
        await db.rollback();
        return 0;
      }

      const { affectedRows } = await db.query(`UPDATE course_delivery_units ${assignment} WHERE id = ?`, [ ...params, id ]);
      await db.commit();
      return affectedRows;

    } catch(error) {
      await db.rollback();
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Блок с названием '${input.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
    }
  }
};

const deleteUnitDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeUnitCourseDICreator(id, db, user);

    return await db.query(`DELETE FROM course_delivery_units WHERE id = ?`, id)
      |> #.affectedRows;
  }
};

export default [{
  unitDelivery
}, {
  createUnitDelivery,
  updateUnitDelivery,
  deleteUnitDelivery
}, {
  delivery_unitsBySubsectionId: new Loader(delivery_loadUnitsBySubsectionId, collate.filter('subsectionId'))
}];