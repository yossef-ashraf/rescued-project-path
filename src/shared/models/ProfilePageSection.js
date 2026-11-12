import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfilePageSection = sequelize.define('ProfilePageSection', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    page: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'global'
    },
    section_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    title: { type: DataTypes.TEXT },
    subtitle: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT },
    meta: { type: DataTypes.JSONB },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'profile_pages_sections',
    timestamps: false
});

export default ProfilePageSection;
