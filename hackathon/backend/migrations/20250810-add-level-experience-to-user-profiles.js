'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [cols] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'",
        { transaction }
      );
      const names = new Set(cols.map(c => c.column_name));

      if (!names.has('level')) {
        await queryInterface.addColumn('user_profiles', 'level', {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false
        }, { transaction });
      }

      if (!names.has('experience')) {
        await queryInterface.addColumn('user_profiles', 'experience', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        }, { transaction });
      }

      if (!names.has('achievements')) {
        await queryInterface.addColumn('user_profiles', 'achievements', {
          type: Sequelize.JSONB,
          defaultValue: []
        }, { transaction });
      }

      if (!names.has('stats')) {
        await queryInterface.addColumn('user_profiles', 'stats', {
          type: Sequelize.JSONB,
          defaultValue: {
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            tasksCompleted: 0,
            studyHours: 0,
            focusSessions: 0
          }
        }, { transaction });
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('user_profiles', 'level', { transaction }).catch(() => {});
      await queryInterface.removeColumn('user_profiles', 'experience', { transaction }).catch(() => {});
      await queryInterface.removeColumn('user_profiles', 'achievements', { transaction }).catch(() => {});
      await queryInterface.removeColumn('user_profiles', 'stats', { transaction }).catch(() => {});
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}; 