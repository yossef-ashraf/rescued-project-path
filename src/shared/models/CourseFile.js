import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const MaterialKnowledgeLibrary = sequelize.define('MaterialKnowledgeLibrary', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    file_name: {
        type: DataTypes.TEXT
    },
    file_url: {
        type: DataTypes.TEXT
    },
    file_type: {
        type: DataTypes.TEXT
    },
    category_name: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    reading_status: {
        type: DataTypes.TEXT,
        defaultValue: 'unread'
    },
    notes: {
        type: DataTypes.TEXT
    },
    item_type: {
        type: DataTypes.TEXT,
        defaultValue: 'material'
    },
    tags: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'material_knowledge_library',
    timestamps: false
});

export const CourseFile = MaterialKnowledgeLibrary;
export default MaterialKnowledgeLibrary;
