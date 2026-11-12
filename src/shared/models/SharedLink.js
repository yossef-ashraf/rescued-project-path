import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const SharedLink = sequelize.define('SharedLink', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    permissions: {
        type: DataTypes.STRING(50),
        defaultValue: 'read_only'
    },
    view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    tableName: 'setting_shared_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default SharedLink;
