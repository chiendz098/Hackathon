'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Discover current columns
      const [columns] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'todos'",
        { transaction }
      );
      const columnNames = new Set(columns.map((c) => c.column_name));

      // Ensure userId exists (temporarily nullable to allow data move)
      if (!columnNames.has('userId')) {
        await queryInterface.addColumn(
          'todos',
          'userId',
          {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          { transaction }
        );
      }

      // Move data from legacy columns if present
      if (columnNames.has('user_id')) {
        await queryInterface.sequelize.query(
          'UPDATE "todos" SET "userId" = user_id WHERE "userId" IS NULL',
          { transaction }
        );
        await queryInterface.removeColumn('todos', 'user_id', { transaction });
      }

      if (columnNames.has('useridint')) {
        // If legacy useridint exists, try to move to userId when userId is still null
        await queryInterface.sequelize.query(
          'UPDATE "todos" SET "userId" = useridint WHERE "userId" IS NULL',
          { transaction }
        ).catch(() => {});
        await queryInterface.removeColumn('todos', 'useridint', { transaction }).catch(() => {});
      }

      if (columnNames.has('userIdInt')) {
        await queryInterface.sequelize.query(
          'UPDATE "todos" SET "userId" = "userIdInt" WHERE "userId" IS NULL',
          { transaction }
        ).catch(() => {});
        await queryInterface.removeColumn('todos', 'userIdInt', { transaction }).catch(() => {});
      }

      // Ensure correct type and NOT NULL
      await queryInterface.changeColumn(
        'todos',
        'userId',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );

      // Add foreign key constraint (idempotent via try/catch)
      await queryInterface.addConstraint('todos', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'fk_todos_userId_users_id',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction,
      }).catch(() => {});

      // Add index on userId (idempotent via try/catch)
      await queryInterface.addIndex('todos', ['userId'], {
        name: 'idx_todos_userId',
        using: 'BTREE',
        transaction,
      }).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove index and FK if exist
      await queryInterface.removeIndex('todos', 'idx_todos_userId', { transaction }).catch(() => {});
      await queryInterface.removeConstraint('todos', 'fk_todos_userId_users_id', { transaction }).catch(() => {});

      // Recreate legacy user_id (nullable) and copy back from userId
      await queryInterface.addColumn(
        'todos',
        'user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      ).catch(() => {});

      await queryInterface.sequelize.query(
        'UPDATE "todos" SET user_id = "userId" WHERE user_id IS NULL',
        { transaction }
      ).catch(() => {});

      // Make userId nullable to better support rollback
      await queryInterface.changeColumn(
        'todos',
        'userId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      ).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
}; 