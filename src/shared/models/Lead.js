import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.TEXT },
    company: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
    phone: { type: DataTypes.TEXT },
    project_type: { type: DataTypes.TEXT },
    budget: { type: DataTypes.TEXT },
    country: { type: DataTypes.TEXT },
    status: {
        type: DataTypes.TEXT,
        defaultValue: 'new'
    },
    notes: { type: DataTypes.TEXT },
    source: { type: DataTypes.TEXT },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'leads',
    timestamps: false
});

export default Lead;
