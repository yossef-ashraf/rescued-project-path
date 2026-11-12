import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Debt = sequelize.define('Debt', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2)
    },
    type: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    note: {
        type: DataTypes.TEXT
    },
    month_id: {
        type: DataTypes.INTEGER
    },
    month: {
        type: DataTypes.INTEGER
    },
    year: {
        type: DataTypes.INTEGER
    },
    week: {
        type: DataTypes.INTEGER
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'finance_debts',
    timestamps: false
});

export default Debt;
