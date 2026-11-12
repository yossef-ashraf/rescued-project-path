import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const AuthLog = sequelize.define('AuthLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT
    },
    username: {
        type: DataTypes.STRING
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ip_address: {
        type: DataTypes.STRING
    },
    user_agent: {
        type: DataTypes.TEXT
    },
    details: {
        type: DataTypes.JSONB
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'setting_auth_logs',
    timestamps: false
});

export default AuthLog;
