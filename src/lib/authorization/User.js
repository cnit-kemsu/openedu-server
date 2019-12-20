import CachedValue from './CachedValue';
import { getSubsection } from './Subsection';

const users = [];

class User extends CachedValue {

  constructor(id, db) {
    super(db);
    this.id = id;
  }

  async _obtain(db) {

    this.role = await db.query(`SELECT role FROM users WHERE id = ${this.id}`)
    |> #[0].role;

    if (this.role === 'student') {
      this.courses = await db.query(`
        SELECT course_id id FROM free_course_enrollments WHERE user_id = ${this.id}
        UNION ALL
        SELECT course_id id FROM paid_course_purchases WHERE user_id = ${this.id}
      `);
    } else if (this.role === 'instructor' || this.role === 'admin') {
      this.courses = await db.query(`SELECT course_id id FROM instructor_assignments WHERE user_id = ${this.id}`);
    }

  }


  async hasAccessToSubsection(subsectionId) {
    if (this.role === 'superuser' || this.role === 'admin') return true;
    const subsection = await getSubsection(subsectionId);
    const course = this.courses.find(c => c.id === subsection.course_id);
    //return 
  }
}

export async function getUser(id, db) {
  let user = users.find(u => u.id === id);

  if (user === undefined) {
    user = new User(id, db);
    users.push(user);
  }

  return await user?.obtain();
}