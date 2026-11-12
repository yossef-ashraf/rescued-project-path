import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';
import { TaskStatus, TaskPriority } from '../enums/index.js';

export const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.TEXT,
        defaultValue: TaskStatus.PENDING
    },
    company: {
        type: DataTypes.TEXT
    },
    is_daily: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    due_date: {
        type: DataTypes.TEXT
    },
    end_date: {
        type: DataTypes.TEXT
    },
    reminder_time: {
        type: DataTypes.TEXT
    },
    is_recurring: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    repeat_days: {
        type: DataTypes.TEXT
    },
    start_date: {
        type: DataTypes.TEXT
    },
    parent_task_id: {
        type: DataTypes.INTEGER
    },
    duration_hours: {
        type: DataTypes.DECIMAL(6, 2)
    },
    priority: {
        type: DataTypes.STRING,
        defaultValue: TaskPriority.MEDIUM
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'op_tasks',
    timestamps: false
});

export default Task;
