export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('🌱 Starting database seeding...')

    const db = useDrizzle()

    // 1. Seed Roles
    console.log('📋 Seeding roles...')
    const rolesData = [
      {
        name: 'owner',
        description: 'Organization owner with full access',
        permissions: { all: true },
      },
      {
        name: 'admin',
        description: 'Administrator with management access',
        permissions: { manage_users: true, manage_procedures: true, manage_surveys: true },
      },
      {
        name: 'member',
        description: 'Regular member with standard access',
        permissions: { view_procedures: true, view_surveys: true },
      },
      {
        name: 'viewer',
        description: 'Read-only access',
        permissions: { view_only: true },
      },
    ]

    const roles = await db.insert(tables.roles).values(rolesData).returning()
    console.log(`✅ Created ${roles.length} roles`)

    // 2. Seed Organizations
    console.log('🏢 Seeding organizations...')
    const organizationsData = [
      { name: 'Acme Corporation', slug: 'acme-corp' },
      { name: 'TechStart Inc', slug: 'techstart-inc' },
      { name: 'Global Solutions', slug: 'global-solutions' },
    ]

    const organizations = await db.insert(tables.organizations).values(organizationsData).returning()
    console.log(`✅ Created ${organizations.length} organizations`)

    // 3. Seed Users
    console.log('👤 Seeding users...')
    const usersData = [
      {
        name: 'John Doe',
        email: 'john@acme.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        currentOrganizationId: organizations[0].id,
      },
      {
        name: 'Jane Smith',
        email: 'jane@acme.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        currentOrganizationId: organizations[0].id,
      },
      {
        name: 'Mike Johnson',
        email: 'mike@techstart.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        currentOrganizationId: organizations[1].id,
      },
      {
        name: 'Sarah Williams',
        email: 'sarah@global.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        currentOrganizationId: organizations[2].id,
      },
    ]

    const users = await db.insert(tables.users).values(usersData).returning()
    console.log(`✅ Created ${users.length} users`)

    // 4. Seed User-Organization relationships
    console.log('🔗 Seeding user-organization relationships...')
    const ownerRole = roles.find(r => r.name === 'owner')!
    const adminRole = roles.find(r => r.name === 'admin')!

    const userOrganizationsData = [
      { userId: users[0].id, organizationId: organizations[0].id, roleId: ownerRole.id },
      { userId: users[1].id, organizationId: organizations[0].id, roleId: adminRole.id },
      { userId: users[2].id, organizationId: organizations[1].id, roleId: ownerRole.id },
      { userId: users[3].id, organizationId: organizations[2].id, roleId: ownerRole.id },
    ]

    const userOrganizations = await db.insert(tables.userOrganizations).values(userOrganizationsData).returning()
    console.log(`✅ Created ${userOrganizations.length} user-organization relationships`)

    // 5. Seed Surveys
    console.log('📊 Seeding surveys...')
    const surveysData = [
      {
        title: 'Employee Satisfaction Survey',
        jsonData: {
          title: 'Employee Satisfaction Survey',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'rating',
              name: 'satisfaction',
              title: 'How satisfied are you with your work?',
              rateMax: 5,
            }],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Customer Feedback Form',
        jsonData: {
          title: 'Customer Feedback Form',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'text',
              name: 'feedback',
              title: 'Please share your feedback',
            }],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[1].id,
      },
    ]

    const surveys = await db.insert(tables.surveys).values(surveysData).returning()
    console.log(`✅ Created ${surveys.length} surveys`)

    // 6. Seed Procedures
    console.log('📝 Seeding procedures...')
    const proceduresData = [
      {
        title: 'Senior Software Engineer Recruitment',
        description: 'Hiring process for senior backend engineers with 5+ years experience',
        status: 'active',
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Product Manager Recruitment',
        description: 'Looking for an experienced product manager to lead our mobile team',
        status: 'active',
        organizationId: organizations[0].id,
        createdById: users[1].id,
      },
      {
        title: 'Junior Developer Internship',
        description: 'Summer internship program for computer science students',
        status: 'draft',
        organizationId: organizations[1].id,
        createdById: users[2].id,
      },
      {
        title: 'UX Designer Position',
        description: 'Closed position - hired Sarah Williams',
        status: 'closed',
        organizationId: organizations[2].id,
        createdById: users[3].id,
      },
    ]

    const procedures = await db.insert(tables.procedures).values(proceduresData).returning()
    console.log(`✅ Created ${procedures.length} procedures`)

    // 7. Seed Exam Criteria
    console.log('📋 Seeding exam criteria...')
    const examCriteriaData = [
      // For Senior Software Engineer
      { procedureId: procedures[0].id, name: 'technical_skills', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'communication', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'problem_solving', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'teamwork', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'flexibility', minRating: 1, maxRating: 5 },
      // For Product Manager
      { procedureId: procedures[1].id, name: 'leadership', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'critical_thinking', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'communication', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'creativity', minRating: 1, maxRating: 5 },
      // For Junior Developer
      { procedureId: procedures[2].id, name: 'learning_ability', minRating: 1, maxRating: 5 },
      { procedureId: procedures[2].id, name: 'motivation', minRating: 1, maxRating: 5 },
      { procedureId: procedures[2].id, name: 'technical_skills', minRating: 1, maxRating: 5 },
    ]

    const examCriteria = await db.insert(tables.examCriteria).values(examCriteriaData).returning()
    console.log(`✅ Created ${examCriteria.length} exam criteria`)

    // 8. Seed Contenders
    console.log('👥 Seeding contenders...')
    const contendersData = [
      // For Senior Software Engineer
      {
        name: 'Alice Anderson',
        email: 'alice.anderson@email.com',
        phone: '+1234567890',
        status: 'interviewing',
        notes: 'Strong technical background, excellent problem-solving skills',
        procedureId: procedures[0].id,
      },
      {
        name: 'Bob Brown',
        email: 'bob.brown@email.com',
        phone: '+1234567891',
        status: 'pending',
        notes: 'Waiting for technical interview',
        procedureId: procedures[0].id,
      },
      {
        name: 'Charlie Davis',
        email: 'charlie.davis@email.com',
        phone: '+1234567892',
        status: 'approved',
        notes: 'Excellent candidate, recommended for hire',
        procedureId: procedures[0].id,
      },
      {
        name: 'Diana Evans',
        email: 'diana.evans@email.com',
        phone: '+1234567893',
        status: 'rejected',
        notes: 'Not enough experience with required technologies',
        procedureId: procedures[0].id,
      },
      // For Product Manager
      {
        name: 'Edward Foster',
        email: 'edward.foster@email.com',
        phone: '+1234567894',
        status: 'interviewing',
        notes: 'Great product vision, strong leadership skills',
        procedureId: procedures[1].id,
      },
      {
        name: 'Fiona Green',
        email: 'fiona.green@email.com',
        phone: '+1234567895',
        status: 'pending',
        notes: 'Resume review in progress',
        procedureId: procedures[1].id,
      },
      // For Junior Developer Internship
      {
        name: 'George Harris',
        email: 'george.harris@email.com',
        phone: '+1234567896',
        status: 'pending',
        notes: 'CS student from Stanford, strong academic record',
        procedureId: procedures[2].id,
      },
    ]

    const contenders = await db.insert(tables.contenders).values(contendersData).returning()
    console.log(`✅ Created ${contenders.length} contenders`)

    // 9. Seed Contender Files
    console.log('📄 Seeding contender files...')
    const contenderFilesData = [
      {
        contenderId: contenders[0].id,
        fileName: 'alice_anderson_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 245678,
        fileUrl: 'https://example.com/files/alice_anderson_resume.pdf',
      },
      {
        contenderId: contenders[0].id,
        fileName: 'alice_portfolio.pdf',
        fileType: 'application/pdf',
        fileSize: 567890,
        fileUrl: 'https://example.com/files/alice_portfolio.pdf',
      },
      {
        contenderId: contenders[1].id,
        fileName: 'bob_brown_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 189456,
        fileUrl: 'https://example.com/files/bob_brown_resume.pdf',
      },
      {
        contenderId: contenders[2].id,
        fileName: 'charlie_davis_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 234567,
        fileUrl: 'https://example.com/files/charlie_davis_resume.pdf',
      },
      {
        contenderId: contenders[4].id,
        fileName: 'edward_foster_resume.pdf',
        fileType: 'application/pdf',
        fileSize: 198765,
        fileUrl: 'https://example.com/files/edward_foster_resume.pdf',
      },
    ]

    const contenderFiles = await db.insert(tables.contenderFiles).values(contenderFilesData).returning()
    console.log(`✅ Created ${contenderFiles.length} contender files`)

    // 10. Seed Exam Scores
    console.log('⭐ Seeding exam scores...')
    const examScoresData = [
      // Alice Anderson scores (Senior Software Engineer)
      { contenderId: contenders[0].id, criteriaId: examCriteria[0].id, score: 5, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[1].id, score: 4, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[2].id, score: 5, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[3].id, score: 4, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[4].id, score: 5, evaluatedById: users[0].id },
      // Charlie Davis scores (approved candidate)
      { contenderId: contenders[2].id, criteriaId: examCriteria[0].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[1].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[2].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[3].id, score: 4, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[4].id, score: 5, evaluatedById: users[1].id },
      // Diana Evans scores (rejected candidate)
      { contenderId: contenders[3].id, criteriaId: examCriteria[0].id, score: 2, evaluatedById: users[0].id },
      { contenderId: contenders[3].id, criteriaId: examCriteria[1].id, score: 3, evaluatedById: users[0].id },
      { contenderId: contenders[3].id, criteriaId: examCriteria[2].id, score: 2, evaluatedById: users[0].id },
      // Edward Foster scores (Product Manager)
      { contenderId: contenders[4].id, criteriaId: examCriteria[5].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[6].id, score: 4, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[7].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[8].id, score: 4, evaluatedById: users[1].id },
    ]

    const examScores = await db.insert(tables.examScores).values(examScoresData).returning()
    console.log(`✅ Created ${examScores.length} exam scores`)

    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - ${roles.length} roles`)
    console.log(`   - ${organizations.length} organizations`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${userOrganizations.length} user-organization relationships`)
    console.log(`   - ${surveys.length} surveys`)
    console.log(`   - ${procedures.length} procedures`)
    console.log(`   - ${examCriteria.length} exam criteria`)
    console.log(`   - ${contenders.length} contenders`)
    console.log(`   - ${contenderFiles.length} contender files`)
    console.log(`   - ${examScores.length} exam scores`)
    console.log('\n🔑 Login credentials:')
    console.log('   Email: john@acme.com')
    console.log('   Password: password123')

    return {
      result: 'success',
      summary: {
        roles: roles.length,
        organizations: organizations.length,
        users: users.length,
        userOrganizations: userOrganizations.length,
        surveys: surveys.length,
        procedures: procedures.length,
        examCriteria: examCriteria.length,
        contenders: contenders.length,
        contenderFiles: contenderFiles.length,
        examScores: examScores.length,
      },
    }
  },
})
