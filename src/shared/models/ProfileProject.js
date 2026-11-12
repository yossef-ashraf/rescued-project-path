import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileProject = sequelize.define('ProfileProject', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.TEXT },
    company: { type: DataTypes.TEXT },
    role: { type: DataTypes.TEXT },
    link_url: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    logo_url: { type: DataTypes.TEXT },
    country: { type: DataTypes.TEXT },
    geo_lat: { type: DataTypes.DECIMAL },
    geo_long: { type: DataTypes.DECIMAL },
    category: {
        type: DataTypes.TEXT,
        defaultValue: 'other'
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'profile_projects',
    timestamps: false
});

export default ProfileProject;
