import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const TaskComment = sequelize.define('TaskComment', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    task_id: {
        type: DataTypes.BIGINT
    },
    user_id: {
        type: DataTypes.BIGINT
    },
    comment: {
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
    tableName: 'op_task_comments',
    timestamps: false
});

export default TaskComment;
