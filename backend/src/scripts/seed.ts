import dotenv from 'dotenv';
import { sequelize } from '../db';
import logger from '../config/logger';
import { User, Class, ParentStudent } from '../db/models';
import { UserRole } from '../db/models/user.model';

dotenv.config();

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });  // Use force:true to reset DB for seeding

  const [admin] = await User.findOrCreate({
    where: { email: 'admin@classapp.test' },
    defaults: {
      email: 'admin@classapp.test',
      firstName: 'System',
      lastName: 'Admin',
      password: 'Admin@123',
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const [teacher] = await User.findOrCreate({
    where: { email: 'teacher1@classapp.test' },
    defaults: {
      email: 'teacher1@classapp.test',
      firstName: 'Lucy',
      lastName: 'Teacher',
      password: 'Teacher@123',
      role: UserRole.TEACHER,
      active: true,
    },
  });

  const [student1] = await User.findOrCreate({
    where: { email: 'student1@classapp.test' },
    defaults: {
      email: 'student1@classapp.test',
      firstName: 'Kevin',
      lastName: 'Student',
      password: 'Student@123',
      role: UserRole.STUDENT,
      active: true,
    },
  });

  const [student2] = await User.findOrCreate({
    where: { email: 'student2@classapp.test' },
    defaults: {
      email: 'student2@classapp.test',
      firstName: 'Mary',
      lastName: 'Student',
      password: 'Student@123',
      role: UserRole.STUDENT,
      active: true,
    },
  });

  const [parent] = await User.findOrCreate({
    where: { email: 'parent1@classapp.test' },
    defaults: {
      email: 'parent1@classapp.test',
      firstName: 'Grace',
      lastName: 'Parent',
      password: 'Parent@123',
      role: UserRole.PARENT,
      phoneNumber: '0712345678',
      active: true,
    },
  });

  await ParentStudent.findOrCreate({
    where: { parentId: parent.id, studentId: student1.id },
    defaults: { parentId: parent.id, studentId: student1.id, relationshipType: 'guardian' },
  });

  await ParentStudent.findOrCreate({
    where: { parentId: parent.id, studentId: student2.id },
    defaults: { parentId: parent.id, studentId: student2.id, relationshipType: 'guardian' },
  });

  const now = new Date();
  const startDate = new Date(now.getTime());
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date(now.getTime());
  endDate.setMonth(endDate.getMonth() + 3);

  const [class1] = await Class.findOrCreate({
    where: { code: 'MATH8W' },
    defaults: {
      name: 'Math 8 West',
      code: 'MATH8W',
      description: 'Mathematics for Grade 8 West stream',
      teacherId: teacher.id,
      startDate,
      endDate,
      schedule: 'Mon, Wed 8-10 AM',
      active: true,
    },
  });

  const [class2] = await Class.findOrCreate({
    where: { code: 'ENG8E' },
    defaults: {
      name: 'English 8 East',
      code: 'ENG8E',
      description: 'English for Grade 8 East stream',
      teacherId: teacher.id,
      startDate,
      endDate,
      schedule: 'Tue, Thu 10-12 AM',
      active: true,
    },
  });

  const c1: any = class1;
  const c2: any = class2;

  if (!(await c1.hasStudent(student1.id))) {
    await c1.addStudent(student1.id);
  }
  if (!(await c1.hasStudent(student2.id))) {
    await c1.addStudent(student2.id);
  }
  if (!(await c2.hasStudent(student1.id))) {
    await c2.addStudent(student1.id);
  }

  logger.info(`Seeded admin with email ${admin.email}`);
  logger.info(`Seeded teacher with email ${teacher.email}`);
  logger.info(`Seeded students with emails ${student1.email}, ${student2.email}`);
  logger.info(`Seeded parent with email ${parent.email}`);
}

seed()
  .then(() => {
    logger.info('Database seed completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Database seed failed', error);
    process.exit(1);
  });
