import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const TaskAttachment = sequelize.define('TaskAttachment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    task_id: {
        type: DataTypes.BIGINT
    },
    file_name: {
        type: DataTypes.TEXT
    },
    file_path: {
        type: DataTypes.TEXT
    },
    file_size: {
        type: DataTypes.TEXT
    },
    file_type: {
        type: DataTypes.TEXT
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
    tableName: 'op_task_attachments',
    timestamps: false
});

export default TaskAttachment;
