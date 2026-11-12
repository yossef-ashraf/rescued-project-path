import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const MaterialCategory = sequelize.define('MaterialCategory', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    color: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'material_categories',
    timestamps: false
});

export default MaterialCategory;
