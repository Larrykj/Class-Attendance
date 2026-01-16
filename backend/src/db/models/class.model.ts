import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

// Class attributes interface
export interface ClassAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  teacherId: number;
  startDate: Date;
  endDate: Date;
  schedule: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for class creation
export interface ClassCreationAttributes extends Optional<ClassAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

// Class model
class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public teacherId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public schedule!: string;
  public active!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Generate a unique QR code identifier
  public getQRCodeIdentifier(): string {
    return `class-${this.id}-${this.code}-${new Date().toISOString().split('T')[0]}`;
  }
}

Class.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    schedule: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Class schedule information (e.g., "Mon, Wed 2-4 PM")',
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'classes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
    ],
  }
);

export default Class;