'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		console.log('🔄 Renaming todos timestamp columns to camelCase...');
		const qi = queryInterface;
		try {
			// created_at -> createdAt
			await qi.renameColumn('todos', 'created_at', 'createdAt').catch(() => {});
			// updated_at -> updatedAt
			await qi.renameColumn('todos', 'updated_at', 'updatedAt').catch(() => {});
			console.log('✅ Renamed timestamp columns on todos');
		} catch (error) {
			console.error('❌ Error renaming columns on todos:', error);
			throw error;
		}
	},

	down: async (queryInterface, Sequelize) => {
		console.log('↩️ Reverting todos timestamp columns to snake_case...');
		const qi = queryInterface;
		try {
			await qi.renameColumn('todos', 'createdAt', 'created_at').catch(() => {});
			await qi.renameColumn('todos', 'updatedAt', 'updated_at').catch(() => {});
			console.log('✅ Reverted timestamp columns on todos');
		} catch (error) {
			console.error('❌ Error reverting columns on todos:', error);
			throw error;
		}
	}
}; 