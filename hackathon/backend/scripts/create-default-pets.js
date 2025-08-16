const { User, Pet, UserPet, sequelize } = require('../models');

async function createDefaultPets() {
  try {
    console.log('🔄 Starting to create default pets for all users...');
    
    // Check if default pet exists, if not create it
    let defaultPet = await Pet.findOne({ where: { name: 'Starter Pet' } });
    
    if (!defaultPet) {
      console.log('📝 Creating default pet using raw SQL...');
      
      // Use raw SQL to bypass model validation issues
      const [result] = await sequelize.query(`
        INSERT INTO pets (name, species, type, description, isActive, rarity, "baseStats", abilities, "unlockRequirements")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, species
      `, {
        bind: [
          'Starter Pet',
          'cat',
          'starter',
          'A friendly starter companion for new users',
          true,
          'common',
          JSON.stringify({
            happiness: 100,
            energy: 100,
            hunger: 100,
            thirst: 100,
            intelligence: 50,
            loyalty: 50
          }),
          JSON.stringify(['basic_commands', 'motivation']),
          JSON.stringify({
            level: 1,
            achievements: [],
            coins: 0,
            gems: 0,
            specialItems: []
          })
        ]
      });
      
      defaultPet = { id: result[0].id, name: result[0].name, species: result[0].species };
      console.log('✅ Default pet created:', defaultPet.name);
    } else {
      console.log('✅ Default pet already exists:', defaultPet.name);
    }
    
    // Get all users
    const users = await User.findAll();
    console.log(`👥 Found ${users.length} users`);
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const user of users) {
      // Check if user already has a pet
      const existingPet = await UserPet.findOne({
        where: { userId: user.id }
      });
      
      if (!existingPet) {
        // Create default pet for user
        await UserPet.create({
          userId: user.id,
          petId: defaultPet.id,
          nickname: 'My First Pet',
          isActive: true,
          level: 1,
          experience: 0,
          evolutionStage: 0,
          currentStats: {
            happiness: 100,
            energy: 100,
            hunger: 100,
            thirst: 100,
            intelligence: 50,
            loyalty: 50,
            xp: 0,
            level: 1
          },
          lastFed: new Date(),
          lastPlayed: new Date(),
          accessories: [],
          abilities: ['basic_commands', 'motivation']
        });
        
        createdCount++;
        console.log(`🐾 Created default pet for user: ${user.username || user.email}`);
      } else {
        existingCount++;
        console.log(`✅ User ${user.username || user.email} already has a pet`);
      }
    }
    
    console.log('\n🎉 Default pet creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - New pets created: ${createdCount}`);
    console.log(`   - Users with existing pets: ${existingCount}`);
    
  } catch (error) {
    console.error('❌ Error creating default pets:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createDefaultPets(); 