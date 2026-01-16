import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Class, User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';
import { Op } from 'sequelize';

/**
 * Get all classes
 */
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const { active, teacherId } = req.query;
    
    // Build filter options
    const filter: any = {};
    const where: any = {};
    
    // Filter by active status
    if (active !== undefined) {
      where.active = active === 'true';
    }
    
    // Filter by teacher ID
    if (teacherId) {
      where.teacherId = parseInt(teacherId as string, 10);
    }
    
    // For students, only show enrolled classes
    if (req.user?.role === UserRole.STUDENT) {
      const studentClasses = await User.findByPk(req.user.id, {
        include: [{
          model: Class,
          as: 'enrolledClasses',
          where: Object.keys(where).length > 0 ? where : undefined,
        }]
      });
      
      return res.status(200).json((studentClasses as any).enrolledClasses || []);
    }
    
    // For admin and teachers, apply the filters
    if (Object.keys(where).length > 0) {
      filter.where = where;
    }
    
    // Include teacher information
    filter.include = [{
      model: User,
      as: 'teacher',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }];
    
    // Fetch classes
    const classes = await Class.findAll(filter);
    
    return res.status(200).json(classes);
  } catch (error) {
    logger.error('Get all classes error:', error);
    return res.status(500).json({ message: 'Error fetching classes' });
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id, 10);
    
    // Find class with teacher information
    const classData = await Class.findByPk(classId, {
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // For students, check if they are enrolled in the class
    if (req.user?.role === UserRole.STUDENT) {
      const studentClass = await User.findByPk(req.user.id, {
        include: [{
          model: Class,
          as: 'enrolledClasses',
          where: { id: classId }
        }]
      });
      
      if (!studentClass) {
        return res.status(403).json({ message: 'You are not enrolled in this class' });
      }
    }
    
    return res.status(200).json(classData);
  } catch (error) {
    logger.error('Get class by ID error:', error);
    return res.status(500).json({ message: 'Error fetching class' });
  }
};

/**
 * Create a new class
 */
export const createClass = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, code, description, startDate, endDate, schedule } = req.body;
    
    // Set teacherId to the current user if they are a teacher, or use provided ID if admin
    const teacherId = req.user?.role === UserRole.TEACHER 
      ? req.user.id 
      : (req.body.teacherId ? parseInt(req.body.teacherId, 10) : req.user?.id);
    
    // Check if the teacher exists
    if (teacherId !== req.user?.id) {
      const teacher = await User.findOne({ 
        where: { 
          id: teacherId,
          role: UserRole.TEACHER
        }
      });
      
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
    }
    
    // Check if class code is already used
    const existingClass = await Class.findOne({ where: { code } });
    if (existingClass) {
      return res.status(400).json({ message: 'Class code is already in use' });
    }
    
    // Create new class
    const newClass = await Class.create({
      name,
      code,
      description,
      teacherId,
      startDate,
      endDate,
      schedule,
      active: true
    });
    
    logger.info(`New class created: ${name} (${code}) by teacher ID ${teacherId}`);
    
    return res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    logger.error('Create class error:', error);
    return res.status(500).json({ message: 'Error creating class' });
  }
};

/**
 * Update class
 */
export const updateClass = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const classId = parseInt(req.params.id, 10);
    
    // Find class
    const classData = await Class.findByPk(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Authorization check: teachers can only update their own classes
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own classes.' });
    }
    
    // Check if code is changed and already exists
    if (req.body.code && req.body.code !== classData.code) {
      const existingClass = await Class.findOne({ 
        where: { 
          code: req.body.code,
          id: { [Op.ne]: classId }
        } 
      });
      if (existingClass) {
        return res.status(400).json({ message: 'Class code is already in use' });
      }
    }
    
    // Update class
    await classData.update(req.body);
    
    logger.info(`Class updated: ${classData.name} (ID: ${classId})`);
    
    return res.status(200).json({
      message: 'Class updated successfully',
      class: classData
    });
  } catch (error) {
    logger.error('Update class error:', error);
    return res.status(500).json({ message: 'Error updating class' });
  }
};

/**
 * Delete class
 */
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id, 10);
    
    // Find class
    const classData = await Class.findByPk(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Soft delete by setting active to false
    await classData.update({ active: false });
    
    logger.info(`Class deleted (deactivated): ${classData.name} (ID: ${classId})`);
    
    return res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    logger.error('Delete class error:', error);
    return res.status(500).json({ message: 'Error deleting class' });
  }
};

/**
 * Get students enrolled in a class
 */
export const getClassStudents = async (req: Request, res: Response) => {
  try {
    const classId = parseInt(req.params.id, 10);
    
    // Find class with enrolled students
    const classData = await Class.findByPk(classId, {
      include: [{
        model: User,
        as: 'students',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: [] } // Exclude join table data
      }]
    });
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Authorization check: teachers can only view their own classes
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view your own classes.' });
    }
    
    return res.status(200).json((classData as any).students || []);
  } catch (error) {
    logger.error('Get class students error:', error);
    return res.status(500).json({ message: 'Error fetching class students' });
  }
};

/**
 * Enroll students in a class
 */
export const enrollStudents = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const classId = parseInt(req.params.id, 10);
    const { studentIds } = req.body;
    
    // Find class
    const classData = await Class.findByPk(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Authorization check: teachers can only modify their own classes
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own classes.' });
    }
    
    // Verify that all studentIds are valid students
    const students = await User.findAll({
      where: {
        id: studentIds,
        role: UserRole.STUDENT,
        active: true
      }
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'One or more student IDs are invalid' });
    }
    
    // Enroll students
    await (classData as any).addStudents(students);
    
    logger.info(`${students.length} students enrolled in class: ${classData.name} (ID: ${classId})`);
    
    return res.status(200).json({ 
      message: `${students.length} students enrolled successfully`,
      enrolledCount: students.length
    });
  } catch (error) {
    logger.error('Enroll students error:', error);
    return res.status(500).json({ message: 'Error enrolling students' });
  }
};

/**
 * Unenroll students from a class
 */
export const unenrollStudents = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const classId = parseInt(req.params.id, 10);
    const { studentIds } = req.body;
    
    // Find class
    const classData = await Class.findByPk(classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Authorization check: teachers can only modify their own classes
    if (req.user?.role === UserRole.TEACHER && classData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own classes.' });
    }
    
    // Find students to unenroll
    const students = await User.findAll({
      where: {
        id: studentIds
      }
    });
    
    // Unenroll students
    await (classData as any).removeStudents(students);
    
    logger.info(`${students.length} students unenrolled from class: ${classData.name} (ID: ${classId})`);
    
    return res.status(200).json({ 
      message: `${students.length} students unenrolled successfully`,
      unenrolledCount: students.length
    });
  } catch (error) {
    logger.error('Unenroll students error:', error);
    return res.status(500).json({ message: 'Error unenrolling students' });
  }
};

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  enrollStudents,
  unenrollStudents,
};