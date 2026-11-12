import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Price = sequelize.define('Price', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.DECIMAL(12, 2)
    },
    dollar: {
        type: DataTypes.DECIMAL(12, 4)
    },
    riyal: {
        type: DataTypes.DECIMAL(12, 4)
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
    tableName: 'finance_market_prices',
    timestamps: false
});

export default Price;
