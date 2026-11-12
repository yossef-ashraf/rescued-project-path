import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const SharedLinkView = sequelize.define('SharedLinkView', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    link_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    ip_hash: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    viewed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'setting_shared_link_views',
    timestamps: false
});

export default SharedLinkView;
