export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('🌱 Starting database seeding...')

    const db = useDrizzle()

    // 1. Seed Roles (VK-specific roles)
    // Permissions are inferred from role at runtime, not stored in database
    console.log('📋 Seeding VK roles...')
    const rolesData = [
      {
        name: 'admin',
        description: 'Tajomník VK - Creates accounts, defines procedures, creates/assigns tests, sets conditions, performs testing, finalizes documentation. Creates procedures with predefined headers, imports SharePoint documents, manages commission evaluation environment, exports results to PDF. Keycloak OAuth users.',
        requires2FA: 1,
      },
      {
        name: 'member',
        description: 'Invited procedure member - Base organization role for users invited to specific procedures. Access limited to assigned procedures only.',
        requires2FA: 0,
      },
      {
        name: 'subject_expert',
        description: 'Vecný gestor - Creates professional knowledge tests (ODBORNÝ TEST) based on predefined templates from Admin. Can save, duplicate, and edit tests. PROCEDURE ROLE.',
        requires2FA: 0,
      },
      {
        name: 'commission_chair',
        description: 'Predseda komisie - Leads evaluation commission, reviews candidate materials from storage, evaluates oral exams by assigning points to abilities and personality traits, views test results and documents. PROCEDURE ROLE.',
        requires2FA: 0,
      },
      {
        name: 'commission_member',
        description: 'Člen komisie - Commission member who reviews candidate materials, evaluates oral exams by assigning points to abilities and personality traits, views predefined questions and test results. PROCEDURE ROLE.',
        requires2FA: 0,
      },
      {
        name: 'candidate',
        description: 'Uchádzač - Takes assigned tests and views own results. PROCEDURE ROLE.',
        requires2FA: 0,
      },
    ]

    const roles = await db.insert(tables.roles).values(rolesData).returning()
    console.log(`✅ Created ${roles.length} VK roles`)

    // 2. Seed Written Exam Categories (5 types as per VK requirements)
    console.log('📝 Seeding written exam categories...')
    const writtenExamCategoriesData = [
      {
        slug: 'professional_knowledge',
        nameSk: 'Odborný test',
        nameEn: 'Professional Knowledge Test',
        description: 'Test na overenie úrovne ovládania odborných vedomostí. Zamestnanec: 10-20 otázok/20min/12 bodov. Vedúci: 15-30 otázok/30min/18 bodov.',
        isActive: 1,
      },
      {
        slug: 'general_knowledge',
        nameSk: 'Všeobecný test',
        nameEn: 'General Knowledge Test',
        description: 'Test na overenie úrovne ovládania všeobecných vedomostí. Zamestnanec: 20 otázok/20min/6 bodov. Vedúci: 30 otázok/30min/9 bodov.',
        isActive: 1,
      },
      {
        slug: 'state_language',
        nameSk: 'Test zo štátneho jazyka',
        nameEn: 'State Language Test',
        description: 'Test na overenie úrovne ovládania štátneho jazyka. 5 otázok/5min/3 body.',
        isActive: 1,
      },
      {
        slug: 'foreign_language',
        nameSk: 'Test z cudzieho jazyka',
        nameEn: 'Foreign Language Test',
        description: 'Test na overenie úrovne ovládania cudzieho jazyka. A1-A2: 30 otázok/30min/9 bodov. B1: 40 otázok/40min/12 bodov. B2-C2: 40 otázok/40min/14 bodov.',
        isActive: 1,
      },
      {
        slug: 'it_skills',
        nameSk: 'Test z práce s informačnými technológiami',
        nameEn: 'IT Skills Test',
        description: 'Test na overenie ovládania práce s informačnými technológiami. 5-10 úloh/6 bodov.',
        isActive: 1,
      },
    ]

    const writtenExamCategories = await db.insert(tables.writtenExamCategories).values(writtenExamCategoriesData).returning()
    console.log(`✅ Created ${writtenExamCategories.length} written exam categories`)

    // 3. Seed Oral Exam Categories (10 personality traits as per VK requirements)
    console.log('🗣️ Seeding oral exam categories...')
    const oralExamCategoriesData = [
      {
        slug: 'self_confidence',
        nameSk: 'Sebadôvera',
        nameEn: 'Self-confidence',
        description: 'Schopnosť veriť vo vlastné schopnosti a rozhodnutia',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'conscientiousness_reliability',
        nameSk: 'Svedomitosť a spoľahlivosť',
        nameEn: 'Conscientiousness and Reliability',
        description: 'Dôkladnosť a spoľahlivosť pri plnení úloh',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'independence',
        nameSk: 'Samostatnosť',
        nameEn: 'Independence',
        description: 'Schopnosť pracovať samostatne bez dohľadu',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'motivation',
        nameSk: 'Motivácia',
        nameEn: 'Motivation',
        description: 'Vnútorná motivácia a drive',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'adaptability_flexibility',
        nameSk: 'Adaptabilita a flexibilita',
        nameEn: 'Adaptability and Flexibility',
        description: 'Schopnosť prispôsobiť sa zmenám',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'work_under_pressure',
        nameSk: 'Schopnosť pracovať pod tlakom',
        nameEn: 'Ability to Work Under Pressure',
        description: 'Zvládanie stresových situácií',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'decision_making',
        nameSk: 'Rozhodovacia schopnosť',
        nameEn: 'Decision-making Ability',
        description: 'Schopnosť robiť kvalitné rozhodnutia',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'communication_skills',
        nameSk: 'Komunikačné zručnosti',
        nameEn: 'Communication Skills',
        description: 'Efektívna verbálna a neverbálna komunikácia',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'analytical_thinking',
        nameSk: 'Analytické, koncepčné a strategické myslenie',
        nameEn: 'Analytical, Conceptual and Strategic Thinking',
        description: 'Schopnosť analyzovať a strategicky myslieť',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
      {
        slug: 'management_skills',
        nameSk: 'Riadiace schopnosti',
        nameEn: 'Management Skills',
        description: 'Schopnosť riadiť ľudí a procesy',
        minRating: 1,
        maxRating: 5,
        isActive: 1,
      },
    ]

    const oralExamCategories = await db.insert(tables.oralExamCategories).values(oralExamCategoriesData).returning()
    console.log(`✅ Created ${oralExamCategories.length} oral exam categories`)

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
    const adminRole = roles.find(r => r.name === 'admin')!
    const commissionChairRole = roles.find(r => r.name === 'commission_chair')!

    const userOrganizationsData = [
      { userId: users[0].id, organizationId: organizations[0].id, roleId: adminRole.id },
      { userId: users[1].id, organizationId: organizations[0].id, roleId: commissionChairRole.id },
      { userId: users[2].id, organizationId: organizations[1].id, roleId: adminRole.id },
      { userId: users[3].id, organizationId: organizations[2].id, roleId: adminRole.id },
    ]

    const userOrganizations = await db.insert(tables.userOrganizations).values(userOrganizationsData).returning()
    console.log(`✅ Created ${userOrganizations.length} user-organization relationships`)

    // 5. Seed Surveys
    console.log('📊 Seeding surveys...')
    const surveysData = [
      {
        title: 'Odborný test - Softvérové inžinierstvo',
        category: 'professional_knowledge',
        jsonData: {
          title: 'Odborný test - Softvérové inžinierstvo',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'radiogroup',
              name: 'q1',
              title: 'Čo je to binárny strom?',
              choices: ['Dátová štruktúra s dvomi potomkami', 'Lineárna dátová štruktúra', 'Graf bez cyklov'],
              correctAnswer: 'Dátová štruktúra s dvomi potomkami',
            }, {
              type: 'radiogroup',
              name: 'q2',
              title: 'Aká je časová zložitosť binárneho vyhľadávania?',
              choices: ['O(n)', 'O(log n)', 'O(n²)'],
              correctAnswer: 'O(log n)',
            }],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Všeobecný test',
        category: 'general_knowledge',
        jsonData: {
          title: 'Všeobecný test',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'radiogroup',
              name: 'q1',
              title: 'Čo je hlavné mesto Slovenska?',
              choices: ['Bratislava', 'Praha', 'Viedeň'],
              correctAnswer: 'Bratislava',
            }],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[1].id,
      },
      {
        title: 'Test zo štátneho jazyka',
        category: 'state_language',
        jsonData: {
          title: 'Test zo štátneho jazyka',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'radiogroup',
              name: 'q1',
              title: 'Ktorý tvar je správny?',
              choices: ['štyria muži', 'štyri muži', 'štyrom muži'],
              correctAnswer: 'štyria muži',
            }],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Test z cudzieho jazyka - Angličtina B2',
        category: 'foreign_language',
        jsonData: {
          title: 'Test z cudzieho jazyka - Angličtina B2',
          pages: [{
            name: 'page1',
            elements: [{
              type: 'radiogroup',
              name: 'q1',
              title: 'Choose the correct form: "I have been working here ___ 5 years"',
              choices: ['for', 'since', 'during'],
              correctAnswer: 'for',
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
        identifier: 'VK/2025/001',
        title: 'Senior Software Engineer Recruitment',
        description: 'Hiring process for senior backend engineers with 5+ years experience',
        status: 'active',
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        identifier: 'VK/2025/002',
        title: 'Product Manager Recruitment',
        description: 'Looking for an experienced product manager to lead our mobile team',
        status: 'active',
        organizationId: organizations[0].id,
        createdById: users[1].id,
      },
      {
        identifier: 'VK/2025/003',
        title: 'Junior Developer Internship',
        description: 'Summer internship program for computer science students',
        status: 'draft',
        organizationId: organizations[1].id,
        createdById: users[2].id,
      },
      {
        identifier: 'VK/2025/004',
        title: 'UX Designer Position',
        description: 'Closed position - hired Sarah Williams',
        status: 'closed',
        organizationId: organizations[2].id,
        createdById: users[3].id,
      },
    ]

    const procedures = await db.insert(tables.procedures).values(proceduresData).returning()
    console.log(`✅ Created ${procedures.length} procedures`)

    // 7. Seed Procedure Surveys
    console.log('📝 Seeding procedure surveys...')
    const procedureSurveysData = [
      // For Senior Software Engineer Recruitment
      { procedureId: procedures[0].id, surveyId: surveys[0].id, order: 0 }, // Technical Assessment
      { procedureId: procedures[0].id, surveyId: surveys[2].id, order: 1 }, // Written Exam
      // For Product Manager Recruitment
      { procedureId: procedures[1].id, surveyId: surveys[1].id, order: 0 }, // Personality Test
      { procedureId: procedures[1].id, surveyId: surveys[3].id, order: 1 }, // Language Test
    ]

    const procedureSurveys = await db.insert(tables.procedureSurveys).values(procedureSurveysData).returning()
    console.log(`✅ Created ${procedureSurveys.length} procedure survey assignments`)

    // 8. Seed Exam Criteria
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

    // 8. Seed Procedure Assignments (assign staff to procedures)
    console.log('📌 Seeding procedure assignments...')
    const subjectExpertRole = roles.find(r => r.name === 'subject_expert')!
    const commissionMemberRole = roles.find(r => r.name === 'commission_member')!

    const procedureAssignmentsData = [
      // Assign Jane (commission_chair in org) as commission member to procedure 0
      { procedureId: procedures[0].id, userId: users[1].id, roleId: commissionMemberRole.id },
      // Assign Mike (admin in org 2) as subject expert to procedure 2
      { procedureId: procedures[2].id, userId: users[2].id, roleId: subjectExpertRole.id },
    ]

    const procedureAssignments = await db.insert(tables.procedureAssignments).values(procedureAssignmentsData).returning()
    console.log(`✅ Created ${procedureAssignments.length} procedure assignments`)

    // 9. Seed Contenders
    console.log('👥 Seeding contenders...')
    const contendersData = [
      // For Senior Software Engineer
      {
        cisIdentifier: 'CIS-2025-001',
        name: 'Alice Anderson',
        email: 'alice.anderson@email.com',
        phone: '+1234567890',
        status: 'evaluating',
        notes: 'Strong technical background, excellent problem-solving skills',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'CIS-2025-002',
        name: 'Bob Brown',
        email: 'bob.brown@email.com',
        phone: '+1234567891',
        status: 'testing',
        notes: 'Waiting for technical interview',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'CIS-2025-003',
        name: 'Charlie Davis',
        email: 'charlie.davis@email.com',
        phone: '+1234567892',
        status: 'passed',
        notes: 'Excellent candidate, recommended for hire',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'CIS-2025-004',
        name: 'Diana Evans',
        email: 'diana.evans@email.com',
        phone: '+1234567893',
        status: 'failed',
        notes: 'Not enough experience with required technologies',
        procedureId: procedures[0].id,
      },
      // For Product Manager
      {
        cisIdentifier: 'CIS-2025-005',
        name: 'Edward Foster',
        email: 'edward.foster@email.com',
        phone: '+1234567894',
        status: 'evaluating',
        notes: 'Great product vision, strong leadership skills',
        procedureId: procedures[1].id,
      },
      {
        cisIdentifier: 'CIS-2025-006',
        name: 'Fiona Green',
        email: 'fiona.green@email.com',
        phone: '+1234567895',
        status: 'registered',
        notes: 'Resume review in progress',
        procedureId: procedures[1].id,
      },
      // For Junior Developer Internship
      {
        cisIdentifier: 'CIS-2025-007',
        name: 'George Harris',
        email: 'george.harris@email.com',
        phone: '+1234567896',
        status: 'registered',
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
    console.log(`   - ${roles.length} VK roles`)
    console.log(`   - ${writtenExamCategories.length} written exam categories`)
    console.log(`   - ${oralExamCategories.length} oral exam categories`)
    console.log(`   - ${organizations.length} organizations`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${userOrganizations.length} user-organization relationships`)
    console.log(`   - ${surveys.length} surveys`)
    console.log(`   - ${procedures.length} procedures`)
    console.log(`   - ${procedureSurveys.length} procedure survey assignments`)
    console.log(`   - ${examCriteria.length} exam criteria`)
    console.log(`   - ${procedureAssignments.length} procedure staff assignments`)
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
        writtenExamCategories: writtenExamCategories.length,
        oralExamCategories: oralExamCategories.length,
        organizations: organizations.length,
        users: users.length,
        userOrganizations: userOrganizations.length,
        surveys: surveys.length,
        procedures: procedures.length,
        procedureAssignments: procedureAssignments.length,
        procedureSurveys: procedureSurveys.length,
        examCriteria: examCriteria.length,
        contenders: contenders.length,
        contenderFiles: contenderFiles.length,
        examScores: examScores.length,
      },
    }
  },
})
