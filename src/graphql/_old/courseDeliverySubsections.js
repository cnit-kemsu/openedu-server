import { types as _, Mapping, Loader, ClientInfo, GraphQLError, collate, authorize } from '@kemsu/graphql-server';
import { authorizeCourseAdmin, resolveDate } from './_shared';
import { authorizeSectionCourseDICreator, SectionDeliveryType } from './courseDeliverySections';
import { UnitDeliveryType } from './courseDeliveryUnits';

const { toColumns, toFilter, toAssignment } = new Mapping({
  name: '_name',
  summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
  sectionId: 'section_id',
  section: { sectionId: 'section_id' },
  units: { id: 'id' },
  accessDate: 'access_date',
  expirationDate: 'expiration_date',
}, {
  keys: keyArray => `id IN (${keyArray})`,
  sectionKeys: keyArray => `section_id IN (${keyArray})`
});

function delivery_loadSubsectionsBySectionId(sectionKeys, { db }, info) {
  const cols = toColumns(info, { sectionId: {} });
  const [filter, params] = toFilter({ sectionKeys });
  return db.query(
    `SELECT ${cols} FROM course_delivery_subsections ${filter}`,
    params
  );
}

function delivery_loadSubsectionById(keys, { db }, info) {
  const cols = toColumns(info, { id: {} });
  const [filter, params] = toFilter({ keys });
  return db.query(
    `SELECT ${cols} FROM course_delivery_subsections ${filter}`,
    params
  );
}

export async function authorizeSubsectionCourseDICreator(id, db, user) {
  if (user.role !== 'instructor') return;
  const [{ creatorId }] = await db.query(`
    SELECT creator_id creatorId FROM course_delivery_instances WHERE id = (
      SELECT course_id FROM course_delivery_sections WHERE id = (
        SELECT section_id FROM course_delivery_subsections WHERE id = ?
      )
    )
  `, id);
  if (user.id !== creatorId) throw new GraphQLError("You don't have enough permission to perform this operation");
}

async function authorizeSubsectionCourseEnrollment(id, db, user) {
  if (user.role !== 'student') return;
  const [{ enrolled } = {}] = await db.query(`
    SELECT 1 enrolled FROM enrollments WHERE user_id = ? AND course_id = (
      SELECT course_id FROM course_delivery_sections WHERE id = (
        SELECT section_id FROM course_delivery_subsections WHERE id = ?
      )
    )
  `, [user.id, id]);
  if (enrolled !== 1) throw new GraphQLError("You must to be enrolled to course to have access to it's subsections");
}

export const SubsectionDeliveryType = new _.Object({
  name: 'SubsectionDelivery',
  fields: () => ({
    id: { type: new _.NonNull(_.Int) },
    name: { type: new _.NonNull(_.String) },
    summary: { type: _.String },
    accessDate: { type: _.String, resolve: ({ accessDate }) => accessDate ? resolveDate(accessDate) : undefined },
    expirationDate: { type: _.String, resolve: ({ expirationDate }) => expirationDate ? resolveDate(expirationDate) : undefined },
    units: {
      type: new _.List(UnitDeliveryType),
      resolve({ id }, {}, { delivery_unitsBySubsectionId }, info) {
        return delivery_unitsBySubsectionId.load(id, info);
      }
    },
    section: {
      type: new _.NonNull(SectionDeliveryType),
      resolve({ sectionId }, {}, { delivery_sectionById }, info) {
        return delivery_sectionById.load(sectionId, info);
      }
    }
  })
});

const subsectionDelivery = {
  type: SubsectionDeliveryType,
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }, info) {
    authorize(user);
    await authorizeSubsectionCourseEnrollment(id, db, user);

    const cols = toColumns(info, { accessDate: {}, expirationDate: {} });
    const [subsection] = await db.query(`SELECT ${cols} FROM course_delivery_subsections WHERE id = ?`, id);
    if (subsection) {
      const nowDate = new Date();
      if (subsection.accessDate && subsection.accessDate > nowDate) throw new GraphQLError("Subsection access not started");
      if (subsection.expirationDate && subsection.expirationDate < nowDate) throw new GraphQLError("Subsection access time expired");
    }
    return subsection;
  }
};

const createSubsectionDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    sectionId: { type: new _.NonNull(_.Int) },
    name: { type: new _.NonNull(_.String) },
    summary: { type: _.String },
    accessDate: { type: _.String },
    expirationDate: { type: _.String }
  },
  async resolve(obj, { summary, ...input }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeSectionCourseDICreator(input.sectionId, db, user);

    if (summary !== undefined) input.summary_value_id = ['create_value(?, NULL)', summary];
    const [assignment, params] = toAssignment(input);
    try {
      return await db.query(`INSERT INTO course_delivery_subsections ${assignment}`, [...params])
      |> #.insertId;
    } catch(error) {
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Подраздел с названием '${input.name}' уже существует`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
    }
  }
};

const updateSubsectionDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) },
    name: { type: _.String },
    summary: { type: _.String },
    accessDate: { type: _.String },
    expirationDate: { type: _.String }
  },
  async resolve(obj, { id, summary, ...input }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeSubsectionCourseDICreator(id, db, user);

    if (summary !== undefined) input.summary_value_id = ["update_value(summary_value_id, ?, NULL)", summary];
    const [assignment, params] = toAssignment(input);
    if (assignment === '') return 0;
    return await db.query(`UPDATE course_delivery_subsections ${assignment} WHERE id = ?`, [ ...params, id ])
    |> #.affectedRows;
  }
};

const deleteSubsectionDelivery = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeSubsectionCourseDICreator(id, db, user);

    return await db.query(`DELETE FROM course_delivery_subsections WHERE id = ?`, id)
      |> #.affectedRows;
  }
};

export default [{
  subsectionDelivery
}, {
  createSubsectionDelivery,
  updateSubsectionDelivery,
  deleteSubsectionDelivery
}, {
  delivery_subsectionsBySectionId: new Loader(delivery_loadSubsectionsBySectionId, collate.filter('sectionId')),
  delivery_subsectionById: new Loader(delivery_loadSubsectionById, collate.find('id'))
}];