import { sequelize, Sequelize } from '../database/database.js';
import User from './User.js';
import Setting from './Setting.js';
import Month from './Month.js';
import Debt from './Debt.js';
import Credit from './Credit.js';
import GoldAsset from './GoldAsset.js';
import Transaction from './Transaction.js';
import Price from './Price.js';
import Task from './Task.js';
import TodoItem from './TodoItem.js';
import Project from './Project.js';
import Lead from './Lead.js';
import Course from './Course.js';
import Notification from './Notification.js';
import AuthLog from './AuthLog.js';
import AuthOtp from './AuthOtp.js';
import VaultPassword from './VaultPassword.js';
import MaterialKnowledgeLibrary, { CourseFile } from './MaterialKnowledgeLibrary.js';
import LearningLessonComment, { CourseComment } from './LearningLessonComment.js';
import MaterialCategory from './MaterialCategory.js';
import TaskComment from './TaskComment.js';
import TaskAttachment from './TaskAttachment.js';
import LeadComment from './LeadComment.js';
import LeadAttachment from './LeadAttachment.js';
import ProfilePersonalInfo from './ProfilePersonalInfo.js';
import ProfileAbout from './ProfileAbout.js';
import ProfileEducation from './ProfileEducation.js';
import ProfileCertificate from './ProfileCertificate.js';
import ProfileExperience from './ProfileExperience.js';
import ProfileProject from './ProfileProject.js';
import ProfileSkill from './ProfileSkill.js';
import ProfilePageSection from './ProfilePageSection.js';
import JobRun from './JobRun.js';
import JobLock from './JobLock.js';
import SharedLink from './SharedLink.js';
import SharedLinkView from './SharedLinkView.js';
import LearningLesson from './LearningLesson.js';
import LearningLessonAttachment from './LearningLessonAttachment.js';
import LearningLessonResource from './LearningLessonResource.js';

// Relations
Month.hasMany(Debt, { foreignKey: 'month_id', as: 'debts' });
Debt.belongsTo(Month, { foreignKey: 'month_id', as: 'monthInfo' });

Month.hasMany(Credit, { foreignKey: 'month_id', as: 'credits' });
Credit.belongsTo(Month, { foreignKey: 'month_id', as: 'monthInfo' });

Month.hasMany(Transaction, { foreignKey: 'month_id', as: 'transactions' });
Transaction.belongsTo(Month, { foreignKey: 'month_id', as: 'monthInfo' });

User.hasMany(AuthLog, { foreignKey: 'user_id', as: 'authLogs' });
AuthLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Course.hasMany(MaterialKnowledgeLibrary, { foreignKey: 'course_id', as: 'files' });
MaterialKnowledgeLibrary.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Course.hasMany(LearningLessonComment, { foreignKey: 'course_id', as: 'comments' });
LearningLessonComment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

Task.hasMany(TaskAttachment, { foreignKey: 'task_id', as: 'attachments' });
TaskAttachment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

Lead.hasMany(LeadComment, { foreignKey: 'lead_id', as: 'comments' });
LeadComment.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

Lead.hasMany(LeadAttachment, { foreignKey: 'lead_id', as: 'attachments' });
LeadAttachment.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

Course.hasMany(LearningLesson, { foreignKey: 'course_id', as: 'lessons' });
LearningLesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

LearningLesson.hasMany(LearningLessonAttachment, { foreignKey: 'lesson_id', as: 'attachments' });
LearningLessonAttachment.belongsTo(LearningLesson, { foreignKey: 'lesson_id', as: 'lesson' });

LearningLesson.hasMany(LearningLessonResource, { foreignKey: 'lesson_id', as: 'resources' });
LearningLessonResource.belongsTo(LearningLesson, { foreignKey: 'lesson_id', as: 'lesson' });

LearningLesson.hasMany(LearningLessonComment, { foreignKey: 'lesson_id', as: 'lessonComments' });
LearningLessonComment.belongsTo(LearningLesson, { foreignKey: 'lesson_id', as: 'lesson' });

SharedLink.hasMany(SharedLinkView, { foreignKey: 'link_id', as: 'views', onDelete: 'CASCADE', hooks: true });
SharedLinkView.belongsTo(SharedLink, { foreignKey: 'link_id', onDelete: 'CASCADE' });

const InvestmentAndSavings = GoldAsset;
const LocalProject = Project;

export {
    sequelize,
    Sequelize,
    User,
    Setting,
    Month,
    Debt,
    Credit,
    GoldAsset,
    InvestmentAndSavings,
    Transaction,
    Price,
    Task,
    TodoItem,
    Project,
    LocalProject,
    Lead,
    Course,
    Notification,
    AuthLog,
    AuthOtp,
    VaultPassword,
    MaterialKnowledgeLibrary,
    CourseFile,
    LearningLessonComment,
    CourseComment,
    MaterialCategory,
    TaskComment,
    TaskAttachment,
    LeadComment,
    LeadAttachment,
    ProfilePersonalInfo,
    ProfileAbout,
    ProfileEducation,
    ProfileCertificate,
    ProfileExperience,
    ProfileProject,
    ProfileSkill,
    ProfilePageSection,
    JobRun,
    JobLock,
    SharedLink,
    SharedLinkView,
    LearningLesson,
    LearningLessonAttachment,
    LearningLessonResource
};

const models = {
    sequelize,
    Sequelize,
    User,
    Setting,
    Month,
    Debt,
    Credit,
    GoldAsset,
    InvestmentAndSavings,
    Transaction,
    Price,
    Task,
    TodoItem,
    Project,
    Lead,
    Course,
    Notification,
    AuthLog,
    AuthOtp,
    VaultPassword,
    MaterialKnowledgeLibrary,
    CourseFile,
    LearningLessonComment,
    CourseComment,
    MaterialCategory,
    TaskComment,
    TaskAttachment,
    LeadComment,
    LeadAttachment,
    ProfilePersonalInfo,
    ProfileAbout,
    ProfileEducation,
    ProfileCertificate,
    ProfileExperience,
    ProfileProject,
    ProfileSkill,
    ProfilePageSection,
    JobRun,
    JobLock,
    SharedLink,
    SharedLinkView,
    LearningLesson,
    LearningLessonAttachment,
    LearningLessonResource
};

export default models;
