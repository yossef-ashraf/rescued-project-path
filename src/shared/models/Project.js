import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    company: {
        type: DataTypes.TEXT
    },
    start_date: {
        type: DataTypes.TEXT
    },
    end_date: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.TEXT,
        defaultValue: 'active'
    },
    description: {
        type: DataTypes.TEXT
    },
    tech_stack: {
        type: DataTypes.TEXT
    },
    files: {
        type: DataTypes.TEXT
    },
    comments: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'local_projects',
    timestamps: false
});

export default Project;
