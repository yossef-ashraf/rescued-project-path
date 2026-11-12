import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileCertificate = sequelize.define('ProfileCertificate', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.TEXT },
    institution: { type: DataTypes.TEXT },
    issue_date: { type: DataTypes.TEXT }
}, {
    tableName: 'profile_certificates',
    timestamps: false
});

export default ProfileCertificate;
