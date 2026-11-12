// The original app built a Sequelize instance here; it now uses the Lovable Cloud data layer.
import { sequelize, Sequelize } from './orm.js';

export { sequelize, Sequelize };
export default sequelize;
