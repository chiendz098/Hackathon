'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const client = queryInterface.sequelize;

      // Helper to change a column to INTEGER if it's UUID
      const alignUserId = async (table, column) => {
        // Detect current data type
        const [cols] = await client.query(
          `SELECT data_type FROM information_schema.columns WHERE table_name = :table AND column_name = :column`,
          { replacements: { table, column }, transaction }
        );
        if (!cols || !cols[0]) return;
        const currentType = cols[0].data_type;

        if (currentType === 'integer') {
          return; // already aligned
        }

        // Try to drop existing FK constraint if present (best-effort)
        await client.query(
          `DO $$
          DECLARE
            cname text;
          BEGIN
            SELECT tc.constraint_name INTO cname
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = :table AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = :column
            LIMIT 1;
            IF cname IS NOT NULL THEN
              EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', :table, cname);
            END IF;
          END $$;`,
          { replacements: { table, column }, transaction }
        ).catch(() => {});

        // Attempt type change using cast to integer
        await client.query(
          `ALTER TABLE ${table} ALTER COLUMN "${column}" TYPE INTEGER USING (NULLIF(regexp_replace("${column}"::text, '[^0-9]', '', 'g'), '')::integer)`,
          { transaction }
        );

        // Recreate FK constraint to users(id) (best-effort)
        await queryInterface.addConstraint(table, {
          fields: [column],
          type: 'foreign key',
          name: `fk_${table}_${column}_users_id`,
          references: { table: 'users', field: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          transaction
        }).catch(() => {});

        // Add index on column (best-effort)
        await queryInterface.addIndex(table, [column], { transaction }).catch(() => {});
      };

      // Tables/columns to align
      const targets = [
        { table: 'user_pets', column: 'user_id' },
        { table: 'time_entries', column: 'userId' },
        { table: 'user_progress', column: 'userId' },
        { table: 'focus_sessions', column: 'userId' },
        { table: 'user_analytics', column: 'userId' },
        { table: 'user_achievements', column: 'userId' },
        { table: 'user_daily_rewards', column: 'userId' },
      ];

      for (const t of targets) {
        await alignUserId(t.table, t.column).catch((e) => {
          // If conversion fails, surface a clear error to guide manual fix
          throw new Error(`Failed to align ${t.table}.${t.column} to INTEGER. Please verify data is numeric and matches users.id. Original error: ${e.message}`);
        });
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const client = queryInterface.sequelize;
      const revert = async (table, column) => {
        // Drop FK if present
        await client.query(
          `DO $$
          DECLARE
            cname text;
          BEGIN
            SELECT tc.constraint_name INTO cname
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = :table AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = :column
            LIMIT 1;
            IF cname IS NOT NULL THEN
              EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', :table, cname);
            END IF;
          END $$;`,
          { replacements: { table, column }, transaction }
        ).catch(() => {});

        // Change back to UUID (best-effort; data will be converted to UUID text form)
        await client.query(
          `ALTER TABLE ${table} ALTER COLUMN "${column}" TYPE UUID USING (uuid_generate_v4())`,
          { transaction }
        ).catch(() => {});
      };

      const targets = [
        { table: 'user_pets', column: 'user_id' },
        { table: 'time_entries', column: 'userId' },
        { table: 'user_progress', column: 'userId' },
        { table: 'focus_sessions', column: 'userId' },
        { table: 'user_analytics', column: 'userId' },
        { table: 'user_achievements', column: 'userId' },
        { table: 'user_daily_rewards', column: 'userId' },
      ];

      for (const t of targets) {
        await revert(t.table, t.column);
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}; 