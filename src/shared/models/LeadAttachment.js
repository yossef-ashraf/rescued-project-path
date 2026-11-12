import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LeadAttachment = sequelize.define('LeadAttachment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    lead_id: {
        type: DataTypes.BIGINT
    },
    comment_id: {
        type: DataTypes.BIGINT
    },
    file_name: {
        type: DataTypes.TEXT
    },
    file_path: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'lead_attachments',
    timestamps: false
});

export default LeadAttachment;
