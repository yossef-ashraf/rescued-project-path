import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileExperience = sequelize.define('ProfileExperience', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    company: { type: DataTypes.TEXT },
    role: { type: DataTypes.TEXT },
    duration: { type: DataTypes.TEXT },
    logo_url: { type: DataTypes.TEXT },
    link_url: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT }
}, {
    tableName: 'profile_experience',
    timestamps: false
});

export default ProfileExperience;
