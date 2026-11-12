import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LearningLessonResource = sequelize.define('LearningLessonResource', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    lesson_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    resource_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'link'
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'learning_lesson_resources',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default LearningLessonResource;
