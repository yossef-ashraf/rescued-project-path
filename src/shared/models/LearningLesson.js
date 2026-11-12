import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LearningLesson = sequelize.define('LearningLesson', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    lesson_number: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    private_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'draft'
    },
    progress_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    lecture_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    source_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_opened_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'learning_lessons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default LearningLesson;
