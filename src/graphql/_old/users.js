import { types as _, Mapping, authorize, ClientInfo, GraphQLError, Loader, collate } from '@kemsu/graphql-server';
import { generatePasskey } from './_shared';
import { sendEmail } from '../sendEmail';
import { insertFilesOfValue } from '../lib/insertFilesOfValue';
import { completeAssignmentWithJsonUpdate } from '../lib/completeAssignmentWithJsonUpdate';
import { sitename, url } from '../config';

export const { toColumns, toFilter, toAssignment } = new Mapping({
  verified: 'CASE WHEN passkey IS NULL THEN 1 ELSE 0 END',
  firstname: "JSON_VALUE(_data, '$.firstname')",
  lastname: "JSON_VALUE(_data, '$.lastname')",
  middlename: "JSON_VALUE(_data, '$.middlename')",
  picture: '(SELECT _value FROM _values WHERE _values.id = picture_value_id)',
}, {
  keys: keyArray => `id IN (${keyArray})`,
  email: 'email LIKE ?',
  courseKeys: keyArray => `id IN (SELECT user_id FROM course_delivery_instructors WHERE course_delivery_instance_id IN (${keyArray}))`
});

function authorizeByRole(user) {
  authorize(user);
  if (!['superuser', 'admin'].includes(user.role)) throw new GraphQLError(
    "You don't have enough permission to perform this operation"
  );
}

function loadUserById(keys, { db }, info) {
  const cols = toColumns(info, { id: {} });
  const [filter, params] = toFilter({ keys });
  return db.query(
    `SELECT ${cols} FROM users ${filter}`,
    params
  );
}

// function loadInstructorsByCourseId(courseKeys, { db }, info) {
//   const cols = toColumns(info, { id: {} });
//   const [filter, params] = toFilter({ courseKeys });
//   return db.query(
//     `SELECT ${cols} FROM users ${filter}`,
//     params
//   );
// }

const roleFilter = "role IN ('admin', 'instructor')";

const RoleInputEnumType = new _.EnumType({
  name: 'RoleInputEnum',
  values: {
    ADMIN: { value: 'admin' },
    INSTRUCTOR: { value: 'instructor' }
  }
});

const RoleEnumType = new _.EnumType({
  name: 'RoleEnum',
  values: {
    ADMIN: { value: 'admin' },
    INSTRUCTOR: { value: 'instructor' },
    SUPERUSER: { value: 'superuser' },
    STUDENT: { value: 'student' }
  }
});

export const UserType = new _.Object({
  name: 'User',
  fields: {
    id: { type: new _.NonNull(_.Int) },
    role: { type: RoleEnumType },
    email: { type: new _.NonNull(_.String) },
    verified: { type: new _.NonNull(_.Boolean) },
    firstname: { type: _.String },
    lastname: { type: _.String },
    middlename: { type: _.String },
    picture: {
      type: _.JSON,
      resolve({ picture }) {
        if (!picture) return undefined;
        return JSON.parse(picture);
      }
    },
  }
});

const searchArgs = {
  keys: { type: _.JSON },
  email: { type: _.String }
};

const instructors = {
  type: new _.List(UserType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    nameLike: { type: new _.NonNull(_.String) },
    ...searchArgs
  },
  resolve(obj, { limit = 5, offset = 0, nameLike, ...search }, { db, user }, info) {
    authorizeByRole(user);

    const cols = toColumns(info);
    return db.query(
      `SELECT ${cols} FROM users 
      LEFT JOIN unverified_accounts ON id = user_id
      WHERE role = 'instructor' AND (
        email LIKE ? OR (
          ? LIKE CONCAT('%', JSON_VALUE(_data, '$.firstname'), '%')
          OR ? LIKE CONCAT('%', JSON_VALUE(_data, '$.lastname'), '%')
        )
      ) LIMIT ? OFFSET ?`,
      [ '%' + nameLike + '%', nameLike, nameLike, limit, offset ]
    );
  }
};

const users = {
  type: new _.List(UserType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  resolve(obj, { limit = 10, offset = 0, ...search }, { db, user }, info) {
    authorizeByRole(user);

    if (search.keys !== undefined) if (search.keys.length === 0) return [];

    const cols = toColumns(info);
    const [filter, params] = toFilter(search, [roleFilter]);
    return db.query(
      `SELECT ${cols} FROM users 
      LEFT JOIN unverified_accounts ON id = user_id
      ${filter} LIMIT ? OFFSET ?`,
      [ ...params, limit, offset ]
    );
  }
};

const totalUsers = {
  type: new _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { db, user }) {
    authorizeByRole(user);

    const [filter, params] = toFilter(search, [roleFilter]);
    return await db.query(`SELECT COUNT(*) count FROM users ${filter}`, params)
    |> #[0].count;
  }
};

const userInfo = {
  type: UserType,
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }, info) {
    authorizeByRole(user);

    const cols = toColumns(info);
    return await db.query(`SELECT ${cols} FROM users WHERE ${roleFilter} AND id = ?`, id)
    |> #[0];
  }
};

const userProfile = {
  type: UserType,
  async resolve(obj, args, { db, user }, info) {
    authorize(user);

    const cols = toColumns(info);
    return await db.query(`SELECT ${cols} FROM users WHERE id = ?`, user.id)
    |> #[0];
  }
};

const createUser = {
  type: new _.NonNull(_.Int),
  args: {
    role: { type: new _.NonNull(RoleInputEnumType) },
    email: { type: new _.NonNull(_.String) }
  },
  async resolve(obj, { role, email }, { db, user }) {
    authorizeByRole(user);

    try {

      const { insertId: id } = await db.query(`INSERT INTO users (role, email) values (?, ?)`, [ role, email ]);

      generatePasskey(email) |> [
        db.query(`INSERT INTO unverified_accounts (user_id, passkey) values (?, ?)`, [id, #]),
        sendEmail(email, `Регистрация в системе открытого образования ${sitename}`, `
          <div>Вы были добавлены в систему открытого образования.</div>
          <div>Проверочный ключ: ${#}</div>
          <div>Подтвердите свой аккаунт пройдя по <a href='${url}/account/confirm?email=${encodeURIComponent(JSON.stringify(email))}'>ссылке</a></div>
        `)
      ];
      
      return id;

    } catch(error) {
      if (error.rootCause?.code === 'ER_DUP_ENTRY') throw new GraphQLError(
        `Адрес электронный почты '${email}' уже зарегистрирован`,
        ClientInfo.UNMET_CONSTRAINT
      );
      throw error;
    }
  }
};

const updateRole = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) },
    role: { type: new _.NonNull(RoleInputEnumType) }
  },
  async resolve(obj, { id, role }, { db, user }) {
    authorizeByRole(user);

    return await db.query(`UPDATE users SET role = ? WHERE ${roleFilter} AND id = ?`, [ role, id ])
    |> #.affectedRows;
  }
};

const deleteUser = {
  type: new _.NonNull(_.Int),
  args: {
    id: { type: new _.NonNull(_.Int) }
  },
  async resolve(obj, { id }, { db, user }) {
    authorizeByRole(user);

    return await db.query(`DELETE FROM users WHERE ${roleFilter} AND id = ?`, id)
      |> #.affectedRows;
  }
};

const updateUserProfile = {
  type: UserType,
  args: {
    firstname: { type: _.String },
    lastname: { type: _.String },
    middlename: { type: _.String },
    picture: { type: _.JSON }
  },
  async resolve(obj, { firstname, lastname, middlename, picture, ...input }, { db, user }) {
    authorize(user);

    try {
      await db.beginTransaction();

      if (picture !== undefined) {
        const fileId = await insertFilesOfValue(db, picture);
        input.picture_value_id = [`update_value(picture_value_id, ?, '${fileId}')`, picture];
      }

      const [_assignment, _params] = toAssignment(input);
      const [assignment, params] = completeAssignmentWithJsonUpdate(_assignment, _params, '_data', { firstname, lastname, middlename });
      if (assignment === '') {
        await db.rollback();
        return null;
      }

      const { affectedRows } = await db.query(`UPDATE users ${assignment} WHERE id = ?`, [...params, user.id]);
      await db.commit();
      if (affectedRows === 1) return {
        firstname,
        lastname,
        middlename,
        picture: picture && JSON.stringify(picture),
        ...input
      };
      return null;

    } catch(error) {
      await db.rollback();
      throw error;
    }

  }
};

export default [{
  users,
  totalUsers,
  userInfo,
  userProfile,
  instructors
}, {
  createUser,
  updateRole,
  deleteUser,
  updateUserProfile
}, {
  //instructorsByCourseId: new Loader(loadInstructorsByCourseId, collate.find('id'))
  userById: new Loader(loadUserById, collate.find('id'))
}];
