import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

export interface ParentStudentAttributes {
  id: number;
  parentId: number;
  studentId: number;
  relationshipType?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParentStudentCreationAttributes
  extends Optional<ParentStudentAttributes, 'id' | 'relationshipType' | 'createdAt' | 'updatedAt'> {}

class ParentStudent
  extends Model<ParentStudentAttributes, ParentStudentCreationAttributes>
  implements ParentStudentAttributes
{
  public id!: number;
  public parentId!: number;
  public studentId!: number;
  public relationshipType!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParentStudent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    relationshipType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'parent_students',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['parentId', 'studentId'],
        name: 'parent_student_unique',
      },
    ],
  }
);

export default ParentStudent;
