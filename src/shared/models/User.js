import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    avatar_url: {
        type: DataTypes.STRING
    },
    last_login_at: {
        type: DataTypes.DATE
    },
    last_login_ip: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    telegram_chat_id: {
        type: DataTypes.STRING
    },
    auth_user_id: {
        type: DataTypes.UUID
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'profiles',
    timestamps: false
});

export default User;
