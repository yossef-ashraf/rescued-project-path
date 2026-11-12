import { DataTypes } from '@/shared/database/orm.js';
import { sequelize } from '../database/database.js';

export const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    parent_id: {
        type: DataTypes.INTEGER
    },
    title: {
        type: DataTypes.TEXT
    },
    url: {
        type: DataTypes.TEXT
    },
    category_path: {
        type: DataTypes.TEXT
    },
    resource_type: {
        type: DataTypes.TEXT
    },
    total_units: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completed_units: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    progress_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    start_date: {
        type: DataTypes.TEXT
    },
    expected_end_date: {
        type: DataTypes.TEXT
    },
    days_spent: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    overdue_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.TEXT,
        defaultValue: 'in_progress'
    },
    type: {
        type: DataTypes.TEXT,
        defaultValue: 'course'
    },
    expected_start_date: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    presenter_name: {
        type: DataTypes.TEXT
    },
    presenter_description: {
        type: DataTypes.TEXT
    },
    include_in_stats: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'courses',
    timestamps: false
});

export default Course;
