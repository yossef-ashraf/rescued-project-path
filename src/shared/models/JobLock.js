import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const JobLock = sequelize.define('JobLock', {
    lock_key: {
        type: DataTypes.STRING(120),
        primaryKey: true
    },
    locked_by: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'job_locks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

export default JobLock;
