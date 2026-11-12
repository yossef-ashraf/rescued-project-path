import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Setting = sequelize.define('Setting', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.TEXT
    },
    value: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.TEXT,
        set(val) {
            this.setDataValue('updated_at', val instanceof Date ? val.toISOString() : (val ? String(val) : null));
        }
    }
}, {
    tableName: 'setting_settings',
    timestamps: false
});

export default Setting;
