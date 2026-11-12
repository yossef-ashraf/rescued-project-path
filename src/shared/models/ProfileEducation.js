import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileEducation = sequelize.define('ProfileEducation', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    degree: { type: DataTypes.TEXT },
    institution: { type: DataTypes.TEXT },
    year_range: { type: DataTypes.TEXT },
    grade: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT }
}, {
    tableName: 'profile_education',
    timestamps: false
});

export default ProfileEducation;
