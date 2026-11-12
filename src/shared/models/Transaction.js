import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    month_id: {
        type: DataTypes.INTEGER
    },
    type: {
        type: DataTypes.TEXT
    },
    title: {
        type: DataTypes.TEXT
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2)
    },
    currency: {
        type: DataTypes.TEXT,
        defaultValue: 'EGP'
    },
    transaction_date: {
        type: DataTypes.TEXT
    },
    week_number: {
        type: DataTypes.INTEGER
    },
    note: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'finance_transactions',
    timestamps: false
});

export default Transaction;
