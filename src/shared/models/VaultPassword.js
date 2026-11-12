import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const VaultPassword = sequelize.define('VaultPassword', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    site_name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    site_url: {
        type: DataTypes.TEXT
    },
    user_data_encrypted: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    user_data_iv: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_data_tag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password_encrypted: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    password_iv: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password_tag: {
        type: DataTypes.STRING,
        allowNull: false
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
    tableName: 'setting_vault_passwords',
    timestamps: false
});

export default VaultPassword;
