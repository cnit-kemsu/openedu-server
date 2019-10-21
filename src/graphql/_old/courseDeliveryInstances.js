import { types as _, Mapping, GraphQLError, ClientInfo, Loader, collate, authorize } from '@kemsu/graphql-server';
import { authorizeCourseAdmin, nowDate, resolveDate } from './_shared';
import { SectionDeliveryType } from './courseDeliverySections';
import { insertFilesOfValue } from '../lib/insertFilesOfValue';
import { UserType } from './users';

const { toColumns, toFilter, toAssignment } = new Mapping({
  name: '_name',
  summary: '(SELECT _value FROM _values WHERE _values.id = summary_value_id)',
  description: '(SELECT _value FROM _values WHERE _values.id = description_value_id)',
  picture: '(SELECT _value FROM _values WHERE _values.id = picture_value_id)',
  creatorId: 'creator_id',
  creationDate: 'creation_date',
  startDate: 'start_date',
  enrollmentEndDate: 'enrollment_end_date',
  price: 'price',
  sections: { id: 'id' },
  //instructors: { id: 'id' },
  instructors: `CONCAT('[', (SELECT GROUP_CONCAT(instructors.user_id) FROM course_delivery_instructors instructors WHERE course_delivery_instance_id = id), ']')`,
  enrolled: ({ id } = { id: null }) => `(SELECT 1 enrolled FROM enrollments WHERE course_id = id AND user_id = ${id})`
}, {
  keys: keyArray => `id IN (${keyArray})`,
  name: 'name LIKE ?'
});

export async function authorizeCourseDICreator(id, db, user) {
  if (user.role !== 'instructor') return;
  const [{ releaserId }] = await db.query(`SELECT releaser_id releaserId FROM course_delivery_instances WHERE id = ?`, id);
  if (user.id !== releaserId) throw new GraphQLError("You don't have enough permission to perform this operation");
}

function delivery_loadCourseById(keys, { db }, info) {
  const cols = toColumns(info, { id: {} });
  const [filter, params] = toFilter({ keys });
  return db.query(
    `SELECT ${cols} FROM course_delivery_instances ${filter}`,
    params
  );
}

export const CourseDeliveryInstanceType = new _.Object({
  name: 'CourseDeliveryInstance',
  fields: {
    id: { type: new _.NonNull(_.Int) },
    name: { type: new _.NonNull(_.String) },
    summary: { type: _.String },
    description: {
      type: _.JSON,
      resolve({ description }) {
        if (!description) return undefined;
        return JSON.parse(description);
      }
    },
    picture: {
      type: _.JSON,
      resolve({ picture }) {
        if (!picture) return undefined;
        return JSON.parse(picture);
      }
    },
    // instructors: {
    //   type: _.JSON,
    //   resolve({ instructors }) {
    //     if (!instructors) return undefined;
    //     return JSON.parse(instructors);
    //   }
    // },
    instructors: {
      type: new _.List(UserType),
      resolve({ instructors }, {}, { userById }, info) {
        if (!instructors) return null;
        return userById.loadMany(JSON.parse(instructors), info);
      }
    },
    price: { type: _.Float },
    creatorId: { type: new _.NonNull(_.Int) },
    creationDate: { type: new _.NonNull(_.String), resolve: ({ creationDate }) => resolveDate(creationDate) },
    startDate: { type: _.String, resolve: ({ startDate }) => startDate && resolveDate(startDate) },
    enrollmentEndDate: { type: _.String, resolve: ({ enrollmentEndDate }) => enrollmentEndDate && resolveDate(enrollmentEndDate) },
    sections: {
      type: new _.List(SectionDeliveryType),
      resolve({ id }, {}, { delivery_sectionsByCourseId }, info) {
        return delivery_sectionsByCourseId.load(id, info);
      }
    },
    enrolled: { type: _.Boolean }
  }
});

const searchArgs = {
  keys: { type: new _.List(_.Int) },
  name: { type: _.String }
};

const allCourseDeliveryInstances = {
  type: new _.List(CourseDeliveryInstanceType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  resolve(obj, { limit = 10, offset = 0, ...search }, { db, user }, info) {

    const cols = toColumns(info, {}, user);
    const [filter, params] = toFilter(search);
    return db.query(`SELECT ${cols} FROM course_delivery_instances ${filter} LIMIT ? OFFSET ?`, [...params, limit, offset]);
  }
};

//const availabilityFilter1 = "start_date  NOW()";
const availabilityFilter = "enrollment_end_date > NOW() OR enrollment_end_date IS NULL";

const availableCourseDeliveryInstances = {
  type: new _.List(CourseDeliveryInstanceType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  resolve(obj, { limit = 10, offset = 0, ...search }, { db, user }, info) {

    const cols = toColumns(info);
    const [filter, params] = toFilter(search, [availabilityFilter]);
    return db.query(`SELECT ${cols} FROM course_delivery_instances ${filter} LIMIT ? OFFSET ?`, [...params, limit, offset]);
  }
};

const totalCourseDeliveryInstances = {
  type: new _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { db, user }) {

    const [filter, params] = toFilter(search);
    return await db.query(`SELECT COUNT(*) count FROM course_delivery_instances ${filter}`, params)
    |> #[0].count;
  }
};

const courseDeliveryInstance = {
  type: CourseDeliveryInstanceType,
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }, info) {

    const cols = toColumns(info, {}, user);
    return await db.query(`SELECT ${cols} FROM course_delivery_instances WHERE id = ?`, id)
    |> #[0];
  }
};

const userProgressType = new _.Object({
  name: 'UserProgress',
  fields: {
    unitName: { type: new _.NonNull(_.String) },
    score: { type: _.Int },
    quiz: {
      type: _.JSON,
      resolve({ quiz }) {
        if (!quiz) return undefined;
        return JSON.parse(quiz);
      }
    },
  }
});

const courseDeliveryInstanceUserProgress = {
  type: new _.NonNull(new _.List(new _.NonNull(userProgressType))),
  args: {
    courseDeliveryInstanceId: { type: new _.NonNull(_.Int) },
    userId: { type: _.Int }
  },
  resolve(obj, { courseDeliveryInstanceId, userId }, { db, user }, info) {
    authorize(user);
    if (userId) authorizeCourseAdmin(user);
    const _userId = userId || user.id;

    return db.query(`
      SELECT _course_delivery_units._name unitName, _course_delivery_units.quiz, _quiz_attempts.score FROM (
        SELECT id, _name, (SELECT _value FROM _values WHERE id = data_value_id) quiz FROM course_delivery_units WHERE subsection_id IN (
          SELECT id FROM course_delivery_subsections WHERE section_id IN (
            SELECT id FROM course_delivery_sections WHERE course_id = ?
          )
        ) AND _type = 'quiz' 
      ) _course_delivery_units LEFT OUTER JOIN (
        SELECT course_delivery_unit_id, score FROM quiz_attempts WHERE user_id = ?
      ) _quiz_attempts ON _course_delivery_units.id = _quiz_attempts.course_delivery_unit_id
    `, [courseDeliveryInstanceId, _userId]);
  }
};

const courseDeliveryStudents = {
  type: new _.List(UserType),
  args: {
    courseDeliveryInstanceId: { type: new _.NonNull(_.Int) }
  },
  resolve(obj, { courseDeliveryInstanceId }, { db, user }, info) {
    authorize(user);
    authorizeCourseAdmin(user);

    return db.query(`
      SELECT id, JSON_VALUE(_data, '$.firstname') firstname, JSON_VALUE(_data, '$.lastname') lastname, JSON_VALUE(_data, '$.middlename') middlename, email, (SELECT _value FROM _values WHERE _values.id = picture_value_id) picture
      FROM users WHERE id IN (SELECT user_id FROM enrollments WHERE course_id = ?)
    `, [courseDeliveryInstanceId]);
  }
};

const createCourseDeliveryInstance = {
  type: new _.NonNull(_.Int),
  args: {
    courseDesignTemplateId: { type: new _.NonNull(_.Int) },
    startDate: { type: _.String },
    enrollmentEndDate: { type: _.String },
    price: { type: _.Float },
    instructors: { type: _.JSON }
  },
  async resolve(obj, { courseDesignTemplateId, startDate, enrollmentEndDate, price, instructors }, { db, user }) {
    authorizeCourseAdmin(user);

    try {
      await db.beginTransaction();

      const [{ insertId }] = await db.query(`SELECT create_course_delivery_instance(?, ?, ?, ?, ?, ?) insertId`, [courseDesignTemplateId, user.id, nowDate(), startDate || null, enrollmentEndDate || null, price || null]);
      if (instructors) {
        const values = [];
        const params = [];
        for (const instructorId of instructors) {
          values.push('(?, ?, ?)');
          params.push(insertId, instructorId, true);
        }
        await db.query(`INSERT INTO course_delivery_instructors (course_delivery_instance_id, user_id, accepted) VALUES ${values.join(',')}`, params);
      }
      await db.commit();
      return insertId;

    } catch(error) {
      await db.rollback();
      throw error;
    }
  }
};

const updateCourseDeliveryInstance = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: _.Int },
    name: { type: _.String },
    summary: { type: _.String },
    price: { type: _.Float },
    description: { type: _.JSON },
    picture: { type: _.JSON },
    //releaseDate: { type: _.String },
    startDate: { type: _.String },
    enrollmentEndDate: { type: _.String },
    instructors: { type: _.JSON }
  },
  async resolve(obj, { id, summary, description, picture, instructors, ...input }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeCourseDICreator(id, db, user);

    if (summary !== undefined) input.summary_value_id = ['update_value(summary_value_id, ?, NULL)', summary];
    try {
      await db.beginTransaction();

      if (picture !== undefined) {
        const fileId = await insertFilesOfValue(db, picture);
        input.picture_value_id = [`update_value(picture_value_id, ?, '${fileId}')`, picture];
      }

      if (description !== undefined) {
        const fileIdArray = await insertFilesOfValue(db, description);
        input.description_value_id = [`update_value(description_value_id, ?, '${fileIdArray}')`, JSON.stringify(description)];
      }

      let changeInstructors = false;
      if (instructors) {
        const values = [];
        const _params = [];
        for (const instructorId of instructors) {
          values.push('(?, ?, ?)');
          _params.push(id, instructorId, true);
        }
        await db.query(`DELETE FROM course_delivery_instructors WHERE course_delivery_instance_id = ?`, id);
        await db.query(`INSERT INTO course_delivery_instructors (course_delivery_instance_id, user_id, accepted) VALUES ${values.join(',')}`, _params);
        changeInstructors = true;
      }

      const [assignment, params] = toAssignment(input);

      if (assignment === '' && changeInstructors) {
        await db.commit();
        return 1;
      }

      if (assignment === '') {
        await db.rollback();
        return 0;
      }

      const { affectedRows } = await db.query(`UPDATE course_delivery_instances ${assignment} WHERE id = ?`, [...params, id]);

      await db.commit();
      return affectedRows;

    } catch(error) {
      await db.rollback();
      throw error;
    }

  }
};

const deleteCourseDeliveryInstance = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }) {
    authorizeCourseAdmin(user);
    await authorizeCourseDICreator(id, db, user);

    return await db.query(`DELETE FROM course_delivery_instances WHERE id = ?`, id)
      |> #.affectedRows;
  }
};

const enrollToCourseDeliveryInstance = {
  type: new _.NonNull(_.Int),
  args: {
    courseId: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { courseId }, { db, user }) {
    authorize(user);

    const [courseDelivery] = await await db.query(`
      SELECT start_date startDate, enrollment_end_date enrollmentEndDate, price FROM course_delivery_instances WHERE id = ?
    `, courseId);
    if (courseDelivery) {
      const _nowDate = new Date();
      if (courseDelivery.startDate && courseDelivery.startDate > _nowDate) throw new GraphQLError("Course not started");
      if (courseDelivery.enrollmentEndDate && courseDelivery.enrollmentEndDate < _nowDate) throw new GraphQLError("Course enrollment expired");
      if (courseDelivery.price) throw new GraphQLError("You must pay first");
    }

    try {

      return await db.query(`INSERT INTO enrollments (user_id, course_id, enroll_date) VALUES (?, ?, ?)`, [user.id, courseId, nowDate()])
    |> #.affectedRows;

    } catch(error) {
      if (error.rootCause?.message.substring(0, 15) === 'Duplicate entry') throw new GraphQLError(
        `You are already enrolled`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
    }
    
  }
};

export default [{
  allCourseDeliveryInstances,
  totalCourseDeliveryInstances,
  courseDeliveryInstance,
  availableCourseDeliveryInstances,
  courseDeliveryInstanceUserProgress,
  courseDeliveryStudents
}, {
  createCourseDeliveryInstance,
  updateCourseDeliveryInstance,
  deleteCourseDeliveryInstance,
  enrollToCourseDeliveryInstance
}, {
  delivery_courseById: new Loader(delivery_loadCourseById, collate.find('id'))
}];
