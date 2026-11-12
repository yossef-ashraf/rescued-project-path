import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const TodoItem = sequelize.define('TodoItem', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    text: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.TEXT,
        defaultValue: 'General'
    },
    description: {
        type: DataTypes.TEXT
    },
    done: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    due_date: {
        type: DataTypes.TEXT
    },
    reminder_time: {
        type: DataTypes.TEXT
    },
    repeat_days: {
        type: DataTypes.TEXT
    },
    start_date: {
        type: DataTypes.TEXT
    },
    end_date: {
        type: DataTypes.TEXT
    },
    series_id: {
        type: DataTypes.TEXT
    },
    duration_hours: {
        type: DataTypes.DECIMAL(6, 2)
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'op_todo_items',
    timestamps: false
});

export default TodoItem;
