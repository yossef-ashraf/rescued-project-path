import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileAbout = sequelize.define('ProfileAbout', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    summary: { type: DataTypes.TEXT },
    what_i_do: { type: DataTypes.TEXT },
    core_expertise: { type: DataTypes.TEXT },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'profile_about',
    timestamps: false
});

export default ProfileAbout;
