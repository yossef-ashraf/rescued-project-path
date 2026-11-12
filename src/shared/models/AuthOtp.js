import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const AuthOtp = sequelize.define('AuthOtp', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    verified: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'setting_auth_otps',
    timestamps: false
});

export default AuthOtp;
