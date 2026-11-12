import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Month = sequelize.define('Month', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    month: {
        type: DataTypes.TEXT
    },
    year: {
        type: DataTypes.INTEGER
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
    tableName: 'finance_fiscal_months',
    timestamps: false
});

export default Month;
