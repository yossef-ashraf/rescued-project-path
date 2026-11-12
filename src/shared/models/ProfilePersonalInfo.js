import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfilePersonalInfo = sequelize.define('ProfilePersonalInfo', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.TEXT },
    title: { type: DataTypes.TEXT },
    photo_path: { type: DataTypes.TEXT },
    logo_path: { type: DataTypes.TEXT },
    phone: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
    linkedin_url: { type: DataTypes.TEXT },
    github_url: { type: DataTypes.TEXT },
    portfolio_url: { type: DataTypes.TEXT },
    location: { type: DataTypes.TEXT },
    military_status: { type: DataTypes.TEXT },
    cv_url: { type: DataTypes.TEXT },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'profile_personal_info',
    timestamps: false
});

export default ProfilePersonalInfo;
