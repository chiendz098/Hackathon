'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [cols] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'",
        { transaction }
      );
      const names = new Set(cols.map(c => c.column_name));

      // online column
      if (!names.has('online')) {
        await queryInterface.addColumn('users', 'online', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }, { transaction });
      }
      // Backfill and enforce NOT NULL
      await queryInterface.sequelize.query(
        'UPDATE "users" SET "online" = false WHERE "online" IS NULL',
        { transaction }
      );
      await queryInterface.changeColumn('users', 'online', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      // lastSeen column
      if (!names.has('lastSeen')) {
        await queryInterface.addColumn('users', 'lastSeen', {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.NOW
        }, { transaction });
      }
      // Backfill nulls to NOW() and enforce NOT NULL
      await queryInterface.sequelize.query(
        'UPDATE "users" SET "lastSeen" = NOW() WHERE "lastSeen" IS NULL',
        { transaction }
      );
      await queryInterface.changeColumn('users', 'lastSeen', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }, { transaction });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('users', 'online', { transaction }).catch(() => {});
      await queryInterface.removeColumn('users', 'lastSeen', { transaction }).catch(() => {});
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}; 