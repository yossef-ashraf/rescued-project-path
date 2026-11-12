import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const LeadComment = sequelize.define('LeadComment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    lead_id: {
        type: DataTypes.BIGINT
    },
    comment: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'lead_comments',
    timestamps: false
});

export default LeadComment;
