'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [cols] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'pets'",
        { transaction }
      );
      const names = new Set(cols.map(c => c.column_name));
      if (!names.has('isBasic')) {
        await queryInterface.addColumn('pets', 'isBasic', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }, { transaction });
      }
      await queryInterface.addIndex('pets', ['isBasic'], { transaction }).catch(() => {});
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('pets', ['isBasic'], { transaction }).catch(() => {});
      await queryInterface.removeColumn('pets', 'isBasic', { transaction }).catch(() => {});
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}; 