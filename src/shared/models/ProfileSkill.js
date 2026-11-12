import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const ProfileSkill = sequelize.define('ProfileSkill', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    category: { type: DataTypes.TEXT },
    skill_name: { type: DataTypes.TEXT },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    badge: { type: DataTypes.TEXT },
    is_highlight: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'profile_skills',
    timestamps: false
});

export default ProfileSkill;
