import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const JobRun = sequelize.define('JobRun', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    job_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pending' // pending, running, completed, failed
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    result: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'job_runs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default JobRun;
