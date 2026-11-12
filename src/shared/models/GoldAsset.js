import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const InvestmentAndSavings = sequelize.define('InvestmentAndSavings', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    currency: {
        type: DataTypes.STRING(20),
        defaultValue: 'EGP'
    },
    val: {
        type: DataTypes.DECIMAL
    },
    amount: {
        type: DataTypes.DECIMAL
    },
    note: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.DECIMAL
    },
    rate: {
        type: DataTypes.DECIMAL(14, 4)
    },
    image: {
        type: DataTypes.TEXT
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
    month_id: {
        type: DataTypes.INTEGER
    },
    gregorian_date: {
        type: DataTypes.TEXT
    },
    hijri_date: {
        type: DataTypes.TEXT
    },
    nisab_completion_date: {
        type: DataTypes.TEXT
    },
    is_after_nisab: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    zakat_due_date_gregorian: {
        type: DataTypes.TEXT
    },
    zakat_due_date_hijri: {
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
    tableName: 'finance_investments_and_savings',
    timestamps: false
});

export const GoldAsset = InvestmentAndSavings;
export default InvestmentAndSavings;
