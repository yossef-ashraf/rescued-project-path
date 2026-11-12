import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.TEXT
    },
    title: {
        type: DataTypes.TEXT
    },
    message: {
        type: DataTypes.TEXT
    },
    link: {
        type: DataTypes.TEXT
    },
    is_read: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    dedup_key: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'setting_notifications',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['dedup_key'], where: { dedup_key: { [Symbol.for('ne')]: null } } }
    ]
});

export default Notification;
