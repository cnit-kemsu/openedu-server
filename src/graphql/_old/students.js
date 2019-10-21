import { types as _, Mapping, authorize, GraphQLError } from '@kemsu/graphql-server';

// async function wait(time) {
//   await new Promise(resolve => {
//     setTimeout(() => resolve(), time);
//   });
// }

const { toColumns, toFilter, /*toAssignment*/ } = new Mapping({
  firstname: "JSON_VALUE(_data, '$.firstname')",
  lastname: "JSON_VALUE(_data, '$.lastname')"
}, {
  keys: keyArray => `id IN (${keyArray})`,
  email: 'email LIKE ?'
});

function authorizeByRole(user) {
  authorize(user);
  if (!['superuser', 'admin', 'instructor'].includes(user.role)) throw new GraphQLError(
    "You don't have enough permission to perform this operation"
  );
}

const roleFilter = "role = 'student'";

const StudentType = new _.Object({
  name: 'Student',
  fields: {
    id: { type: new _.NonNull(_.Int) },
    email: { type: new _.NonNull(_.String) },
    firstname: { type: new _.NonNull(_.String) },
    lastname: { type: new _.NonNull(_.String) }
  }
});

const searchArgs = {
  keys: { type: new _.List(_.Int) },
  email: { type: _.String }
};

const students = {
  type: new _.List(StudentType),
  args: {
    limit: { type: _.Int },
    offset: { type: _.Int },
    ...searchArgs
  },
  async resolve(obj, { limit = 10, offset = 0, ...search }, { db, user }, info) {
    authorizeByRole(user);

    //await wait(1000);

    const cols = toColumns(info);
    const [filter, params] = toFilter(search, [roleFilter]);
    return db.query(`SELECT ${cols} FROM users ${filter} LIMIT ? OFFSET ?`, [ ...params, limit, offset ]);
  }
};

const totalStudents = {
  type: new _.NonNull(_.Int),
  args: searchArgs,
  async resolve(obj, search, { db, user }) {
    authorizeByRole(user);

    const [filter, params] = toFilter(search, [roleFilter]);
    return await db.query(`SELECT COUNT(*) count FROM users ${filter}`, params)
    |> #[0].count;
  }
};

// const studentInfo = {
//   type: StudentType,
//   async resolve(obj, args, { db, user }, info) {
//     authorize(user);

//     const cols = toColumns(info);
//     return await db.query(`SELECT ${cols} FROM users WHERE ${roleFilter} AND id = ?`, user.id)
//     |> #[0];
//   }
// };

// const updateStudent = {
//   type: new _.NonNull(_.Int),
//   args: {
//     id: { type: new _.NonNull(_.Int) }
//     //
//   },
//   async resolve(obj, { id, ...input }, { db, user }) {
//     authorize(user);
//     if (user.id !== id) throw new GraphQLError("You don't have enough permission to perform this operation");

//     const [assignment, params] = toAssignment(input);
//     if (assignment === '') return 0;
//     return await db.query(`UPDATE users ${assignment} WHERE id = ?`, [ ...params, id ])
//     |> #.affectedRows;
//   }
// };

export default [{
  students,
  totalStudents,
  //studentInfo
}, {
  //updateStudent
}];