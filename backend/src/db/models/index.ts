import User from './user.model';
import Class from './class.model';
import Attendance from './attendance.model';
import ParentStudent from './parentStudent.model';

// Define associations between models
User.hasMany(Class, {
  foreignKey: 'teacherId',
  as: 'teachingClasses',
});

Class.belongsTo(User, {
  foreignKey: 'teacherId',
  as: 'teacher',
});

User.belongsToMany(Class, {
  through: 'StudentClasses',
  as: 'enrolledClasses',
  foreignKey: 'studentId',
});

Class.belongsToMany(User, {
  through: 'StudentClasses',
  as: 'students',
  foreignKey: 'classId',
});

Attendance.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

Attendance.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class',
});

User.hasMany(Attendance, {
  foreignKey: 'studentId',
  as: 'attendances',
});

Class.hasMany(Attendance, {
  foreignKey: 'classId',
  as: 'attendances',
});

User.belongsToMany(User, {
  through: ParentStudent,
  as: 'parents',
  foreignKey: 'studentId',
  otherKey: 'parentId',
});

User.belongsToMany(User, {
  through: ParentStudent,
  as: 'children',
  foreignKey: 'parentId',
  otherKey: 'studentId',
});

export {
  User,
  Class,
  Attendance,
  ParentStudent,
};