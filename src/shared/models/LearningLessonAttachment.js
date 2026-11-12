import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LearningLessonAttachment = sequelize.define('LearningLessonAttachment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    lesson_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    file_size: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    storage_provider: {
        type: DataTypes.STRING(50),
        defaultValue: 'local'
    },
    storage_key: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'learning_lesson_attachments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default LearningLessonAttachment;
