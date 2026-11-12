import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LearningLessonComment = sequelize.define('LearningLessonComment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    lesson_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    comment: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'learning_lesson_comments',
    timestamps: false
});

export const CourseComment = LearningLessonComment;
export default LearningLessonComment;
