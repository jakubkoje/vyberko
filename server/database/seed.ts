import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Starting database seeding...')

  try {
    // 1. Seed Roles
    console.log('📋 Seeding roles...')
    const rolesData = [
      {
        name: 'owner',
        description: 'Administrátor organizácie s plným prístupom',
        permissions: { all: true },
      },
      {
        name: 'admin',
        description: 'Tajomník výberovej komisie s prístupom k správe',
        permissions: { manage_users: true, manage_procedures: true, manage_surveys: true },
      },
      {
        name: 'member',
        description: 'Člen komisie so štandardným prístupom',
        permissions: { view_procedures: true, view_surveys: true },
      },
      {
        name: 'viewer',
        description: 'Prístup iba na čítanie',
        permissions: { view_only: true },
      },
    ]

    const roles = await db.insert(schema.roles).values(rolesData).returning()
    console.log(`✅ Created ${roles.length} roles`)

    // 2. Seed Organizations
    console.log('🏢 Seeding organizations...')
    const organizationsData = [
      { name: 'Ministerstvo investícií, regionálneho rozvoja a informatizácie SR', slug: 'mirri' },
      { name: 'Úrad vlády Slovenskej republiky', slug: 'uv-sr' },
      { name: 'Ministerstvo financií SR', slug: 'mf-sr' },
    ]

    const organizations = await db.insert(schema.organizations).values(organizationsData).returning()
    console.log(`✅ Created ${organizations.length} organizations`)

    // 3. Seed Users
    console.log('👤 Seeding users...')
    const usersData = [
      {
        name: 'Ján Novák',
        email: 'jan.novak@mirri.gov.sk',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan',
        currentOrganizationId: organizations[0].id,
      },
      {
        name: 'Mária Horváthová',
        email: 'maria.horvathova@mirri.gov.sk',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        currentOrganizationId: organizations[0].id,
      },
      {
        name: 'Peter Kovács',
        email: 'peter.kovacs@vlada.gov.sk',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter',
        currentOrganizationId: organizations[1].id,
      },
      {
        name: 'Eva Tóthová',
        email: 'eva.tothova@mfsr.sk',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva',
        currentOrganizationId: organizations[2].id,
      },
    ]

    const users = await db.insert(schema.users).values(usersData).returning()
    console.log(`✅ Created ${users.length} users`)

    // 4. Seed User-Organization relationships
    console.log('🔗 Seeding user-organization relationships...')
    const ownerRole = roles.find(r => r.name === 'owner')!
    const adminRole = roles.find(r => r.name === 'admin')!
    const memberRole = roles.find(r => r.name === 'member')!

    const userOrganizationsData = [
      { userId: users[0].id, organizationId: organizations[0].id, roleId: ownerRole.id },
      { userId: users[1].id, organizationId: organizations[0].id, roleId: adminRole.id },
      { userId: users[2].id, organizationId: organizations[1].id, roleId: ownerRole.id },
      { userId: users[3].id, organizationId: organizations[2].id, roleId: ownerRole.id },
    ]

    const userOrganizations = await db.insert(schema.userOrganizations).values(userOrganizationsData).returning()
    console.log(`✅ Created ${userOrganizations.length} user-organization relationships`)

    // 5. Seed Surveys (Written Exam Tests)
    console.log('📊 Seeding surveys...')
    const surveysData = [
      {
        title: 'Odborný test',
        category: 'professional_knowledge',
        status: 'approved',
        jsonData: {
          title: 'Odborný test',
          description: 'Test odborných znalostí',
          showTimer: true,
          maxTimeToFinish: 1200, // 20 minutes in seconds
          pages: [{
            name: 'page1',
            elements: [
              {
                type: 'radiogroup',
                name: 'q1',
                title: 'Čo je to projekt podľa metodiky PRINCE2?',
                correctAnswer: 'answer_a',
                isRequired: true,
                choices: [
                  { value: 'answer_a', text: 'Dočasná organizácia s cieľom doručiť produkty' },
                  { value: 'answer_b', text: 'Trvalá organizácia bez definovaného konca' },
                  { value: 'answer_c', text: 'Súbor úloh bez časového rámca' },
                  { value: 'answer_d', text: 'Neformálne stretnutie pracovnej skupiny' },
                ],
              },
              {
                type: 'radiogroup',
                name: 'q2',
                title: 'Aký je hlavný účel projektového manažmentu?',
                correctAnswer: 'answer_b',
                isRequired: true,
                choices: [
                  { value: 'answer_a', text: 'Znížiť počet zamestnancov' },
                  { value: 'answer_b', text: 'Zabezpečiť úspešné doručenie projektových výstupov' },
                  { value: 'answer_c', text: 'Zvýšiť administratívnu záťaž' },
                  { value: 'answer_d', text: 'Predĺžiť trvanie projektu' },
                ],
              },
              {
                type: 'checkbox',
                name: 'q3',
                title: 'Ktoré z nasledujúcich sú fázy projektu? (Označte všetky správne)',
                correctAnswer: ['answer_a', 'answer_b', 'answer_d'],
                choices: [
                  { value: 'answer_a', text: 'Inicializácia' },
                  { value: 'answer_b', text: 'Plánovanie' },
                  { value: 'answer_c', text: 'Procrastinácia' },
                  { value: 'answer_d', text: 'Realizácia' },
                  { value: 'answer_e', text: 'Špekulácia' },
                ],
              },
            ],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Všeobecný test',
        category: 'general_knowledge',
        status: 'approved',
        jsonData: {
          title: 'Všeobecný test',
          description: 'Test všeobecných znalostí',
          showTimer: true,
          maxTimeToFinish: 900, // 15 minutes in seconds
          pages: [{
            name: 'page1',
            elements: [
              {
                type: 'radiogroup',
                name: 'q1',
                title: 'V ktorom roku sa Slovensko stalo členom EÚ?',
                correctAnswer: 'answer_c',
                isRequired: true,
                choices: [
                  { value: 'answer_a', text: '2000' },
                  { value: 'answer_b', text: '2002' },
                  { value: 'answer_c', text: '2004' },
                  { value: 'answer_d', text: '2007' },
                ],
              },
              {
                type: 'radiogroup',
                name: 'q2',
                title: 'Kto je súčasný prezident Slovenskej republiky?',
                correctAnswer: 'answer_a',
                isRequired: true,
                choices: [
                  { value: 'answer_a', text: 'Peter Pellegrini' },
                  { value: 'answer_b', text: 'Zuzana Čaputová' },
                  { value: 'answer_c', text: 'Andrej Kiska' },
                  { value: 'answer_d', text: 'Ivan Gašparovič' },
                ],
              },
            ],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        title: 'Test zo štátneho jazyka',
        category: 'state_language',
        status: 'approved',
        jsonData: {
          title: 'Test zo štátneho jazyka',
          description: 'Test znalosti slovenského jazyka',
          showTimer: true,
          maxTimeToFinish: 300, // 5 minutes in seconds
          pages: [{
            name: 'page1',
            elements: [
              {
                type: 'radiogroup',
                name: 'q1',
                title: 'Ktoré slovo je napísané správne?',
                correctAnswer: 'answer_b',
                isRequired: true,
                choices: [
                  { value: 'answer_a', text: 'dnesný deň' },
                  { value: 'answer_b', text: 'dnešný deň' },
                  { value: 'answer_c', text: 'dnešní deň' },
                  { value: 'answer_d', text: 'dnešný dňeň' },
                ],
              },
            ],
          }],
        },
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
    ]

    const surveys = await db.insert(schema.surveys).values(surveysData).returning()
    console.log(`✅ Created ${surveys.length} surveys`)

    // 6. Seed Procedures
    console.log('📝 Seeding procedures...')
    const proceduresData = [
      {
        identifier: 'VK/2025/0001',
        title: 'hlavný štátny radca',
        description: 'Výberové konanie na pozíciu hlavného štátneho radcu',
        status: 'active',
        procedureType: 'širšie vnútorné výberové konanie',
        organizationalUnit: 'Odbor implementácie OKP',
        civilServiceSector: '1.03 – Medzinárodná spolupráca, finančné prostriedky Európskej únie',
        positionTitle: 'hlavný štátny radca',
        serviceType: 'stála štátna služba',
        numberOfPositions: 1,
        organizationId: organizations[0].id,
        createdById: users[0].id,
      },
      {
        identifier: 'VK/2025/0002',
        title: 'štátny radca',
        description: 'Výberové konanie na pozíciu štátneho radcu',
        status: 'active',
        procedureType: 'vnútorné výberové konanie',
        organizationalUnit: 'Odbor kontroly a auditu',
        civilServiceSector: '1.07 – Kontrola, dozor, sťažnosti, petície a audit',
        positionTitle: 'štátny radca',
        serviceType: 'stála štátna služba',
        numberOfPositions: 2,
        organizationId: organizations[0].id,
        createdById: users[1].id,
      },
      {
        identifier: 'VK/2025/0003',
        title: 'referent',
        description: 'Výberové konanie na pozíciu referenta',
        status: 'draft',
        procedureType: 'vonkajšie výberové konanie',
        organizationalUnit: 'Odbor personalistiky',
        civilServiceSector: '1.12 – Riadenie ľudských zdrojov',
        positionTitle: 'referent',
        serviceType: 'dočasná štátna služba',
        numberOfPositions: 1,
        organizationId: organizations[1].id,
        createdById: users[2].id,
      },
    ]

    const procedures = await db.insert(schema.procedures).values(proceduresData).returning()
    console.log(`✅ Created ${procedures.length} procedures`)

    // 7. Seed Procedure Surveys (link surveys to procedures)
    console.log('🔗 Seeding procedure surveys...')
    const procedureSurveysData = [
      // Procedure 1 has all 3 tests
      { procedureId: procedures[0].id, surveyId: surveys[0].id, order: 0, timeLimit: 20, totalPoints: 3, passingScore: 2 },
      { procedureId: procedures[0].id, surveyId: surveys[1].id, order: 1, timeLimit: 15, totalPoints: 2, passingScore: 1 },
      { procedureId: procedures[0].id, surveyId: surveys[2].id, order: 2, timeLimit: 5, totalPoints: 1, passingScore: 1 },
      // Procedure 2 has 2 tests
      { procedureId: procedures[1].id, surveyId: surveys[0].id, order: 0, timeLimit: 20, totalPoints: 3, passingScore: 2 },
      { procedureId: procedures[1].id, surveyId: surveys[1].id, order: 1, timeLimit: 15, totalPoints: 2, passingScore: 1 },
    ]

    const procedureSurveys = await db.insert(schema.procedureSurveys).values(procedureSurveysData).returning()
    console.log(`✅ Created ${procedureSurveys.length} procedure-survey links`)

    // 8. Seed Exam Criteria (oral exam categories)
    console.log('📋 Seeding exam criteria...')
    const examCriteriaData = [
      // Procedure 1 - oral exam criteria
      { procedureId: procedures[0].id, name: 'Samostatnosť', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'Komunikácia', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'Analytické myslenie', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'Flexibilita', minRating: 1, maxRating: 5 },
      { procedureId: procedures[0].id, name: 'Zodpovednosť', minRating: 1, maxRating: 5 },
      // Procedure 2
      { procedureId: procedures[1].id, name: 'Samostatnosť', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'Komunikácia', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'Kritické myslenie', minRating: 1, maxRating: 5 },
      { procedureId: procedures[1].id, name: 'Tímová práca', minRating: 1, maxRating: 5 },
      // Procedure 3
      { procedureId: procedures[2].id, name: 'Učenlivosť', minRating: 1, maxRating: 5 },
      { procedureId: procedures[2].id, name: 'Motivácia', minRating: 1, maxRating: 5 },
      { procedureId: procedures[2].id, name: 'Zodpovednosť', minRating: 1, maxRating: 5 },
    ]

    const examCriteria = await db.insert(schema.examCriteria).values(examCriteriaData).returning()
    console.log(`✅ Created ${examCriteria.length} exam criteria`)

    // 9. Seed Contenders (with CIS identifiers for access)
    console.log('👥 Seeding contenders...')
    const contendersData = [
      // Procedure 1 contenders
      {
        cisIdentifier: 'UC-2025-0001',
        name: 'Anna Nováková',
        email: 'anna.novakova@email.com',
        phone: '+421901123456',
        status: 'testing',
        notes: 'Silná kandidátka s technickým vzdelaním',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'UC-2025-0002',
        name: 'Peter Horváth',
        email: 'peter.horvath@email.com',
        phone: '+421902234567',
        status: 'registered',
        notes: 'Čaká na testovanie',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'UC-2025-0003',
        name: 'Jana Kováčová',
        email: 'jana.kovacova@email.com',
        phone: '+421903345678',
        status: 'passed_written',
        notes: 'Úspešne absolvovala písomné testy, čaká na ústny pohovor',
        procedureId: procedures[0].id,
      },
      {
        cisIdentifier: 'UC-2025-0004',
        name: 'Martin Szabó',
        email: 'martin.szabo@email.com',
        phone: '+421904456789',
        status: 'failed_written',
        notes: 'Neúspešný v písomných testoch',
        procedureId: procedures[0].id,
      },
      // Procedure 2 contenders
      {
        cisIdentifier: 'UC-2025-0005',
        name: 'Eva Mészárosová',
        email: 'eva.meszarosova@email.com',
        phone: '+421905567890',
        status: 'testing',
        notes: 'Silná komunikácia, skúsenosti s riadením projektov',
        procedureId: procedures[1].id,
      },
      {
        cisIdentifier: 'UC-2025-0006',
        name: 'Lukáš Varga',
        email: 'lukas.varga@email.com',
        phone: '+421906678901',
        status: 'registered',
        notes: 'Čaká na testovanie',
        procedureId: procedures[1].id,
      },
      // Procedure 3 contenders
      {
        cisIdentifier: 'UC-2025-0007',
        name: 'Zuzana Molnárová',
        email: 'zuzana.molnarova@email.com',
        phone: '+421907789012',
        status: 'registered',
        notes: 'Študentka, vysoká motivácia',
        procedureId: procedures[2].id,
      },
    ]

    const contenders = await db.insert(schema.contenders).values(contendersData).returning()
    console.log(`✅ Created ${contenders.length} contenders`)

    // 9. Seed Contender Files
    console.log('📄 Seeding contender files...')
    const contenderFilesData = [
      {
        contenderId: contenders[0].id,
        fileName: 'zivotopis_anna_novakova.pdf',
        fileType: 'application/pdf',
        fileSize: 245678,
        fileUrl: 'https://example.com/files/zivotopis_anna_novakova.pdf',
      },
      {
        contenderId: contenders[0].id,
        fileName: 'certifikaty_anna_novakova.pdf',
        fileType: 'application/pdf',
        fileSize: 567890,
        fileUrl: 'https://example.com/files/certifikaty_anna_novakova.pdf',
      },
      {
        contenderId: contenders[1].id,
        fileName: 'zivotopis_peter_horvath.pdf',
        fileType: 'application/pdf',
        fileSize: 189456,
        fileUrl: 'https://example.com/files/zivotopis_peter_horvath.pdf',
      },
      {
        contenderId: contenders[2].id,
        fileName: 'zivotopis_jana_kovacova.pdf',
        fileType: 'application/pdf',
        fileSize: 234567,
        fileUrl: 'https://example.com/files/zivotopis_jana_kovacova.pdf',
      },
      {
        contenderId: contenders[4].id,
        fileName: 'zivotopis_eva_meszarosova.pdf',
        fileType: 'application/pdf',
        fileSize: 198765,
        fileUrl: 'https://example.com/files/zivotopis_eva_meszarosova.pdf',
      },
    ]

    const contenderFiles = await db.insert(schema.contenderFiles).values(contenderFilesData).returning()
    console.log(`✅ Created ${contenderFiles.length} contender files`)

    // 10. Seed Survey Responses (completed test results)
    console.log('📝 Seeding survey responses...')
    const surveyResponsesData = [
      // Anna Nováková (contenders[0]) - Completed all 3 tests with good scores
      {
        contenderId: contenders[0].id,
        surveyId: surveys[0].id, // Odborný test
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_a', q2: 'answer_b', q3: ['answer_a', 'answer_b', 'answer_d'] },
        score: 3,
        isPassed: 1,
        startedAt: new Date('2025-01-10T10:00:00'),
        submittedAt: new Date('2025-01-10T10:15:00'),
        timeSpentSeconds: 900,
      },
      {
        contenderId: contenders[0].id,
        surveyId: surveys[1].id, // Všeobecný test
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_c', q2: 'answer_a' },
        score: 2,
        isPassed: 1,
        startedAt: new Date('2025-01-10T10:20:00'),
        submittedAt: new Date('2025-01-10T10:30:00'),
        timeSpentSeconds: 600,
      },
      {
        contenderId: contenders[0].id,
        surveyId: surveys[2].id, // Test zo štátneho jazyka
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_b' },
        score: 1,
        isPassed: 1,
        startedAt: new Date('2025-01-10T10:35:00'),
        submittedAt: new Date('2025-01-10T10:38:00'),
        timeSpentSeconds: 180,
      },
      // Jana Kováčová (contenders[2]) - Passed all tests
      {
        contenderId: contenders[2].id,
        surveyId: surveys[0].id,
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_a', q2: 'answer_b', q3: ['answer_a', 'answer_b', 'answer_d'] },
        score: 3,
        isPassed: 1,
        startedAt: new Date('2025-01-11T09:00:00'),
        submittedAt: new Date('2025-01-11T09:18:00'),
        timeSpentSeconds: 1080,
      },
      {
        contenderId: contenders[2].id,
        surveyId: surveys[1].id,
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_c', q2: 'answer_a' },
        score: 2,
        isPassed: 1,
        startedAt: new Date('2025-01-11T09:20:00'),
        submittedAt: new Date('2025-01-11T09:32:00'),
        timeSpentSeconds: 720,
      },
      {
        contenderId: contenders[2].id,
        surveyId: surveys[2].id,
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_b' },
        score: 1,
        isPassed: 1,
        startedAt: new Date('2025-01-11T09:35:00'),
        submittedAt: new Date('2025-01-11T09:39:00'),
        timeSpentSeconds: 240,
      },
      // Martin Szabó (contenders[3]) - Failed professional test
      {
        contenderId: contenders[3].id,
        surveyId: surveys[0].id,
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_c', q2: 'answer_a', q3: ['answer_b'] }, // Wrong answers
        score: 0,
        isPassed: 0,
        startedAt: new Date('2025-01-12T14:00:00'),
        submittedAt: new Date('2025-01-12T14:12:00'),
        timeSpentSeconds: 720,
      },
      {
        contenderId: contenders[3].id,
        surveyId: surveys[1].id,
        procedureId: procedures[0].id,
        responseData: { q1: 'answer_b', q2: 'answer_c' }, // 0/2 correct
        score: 0,
        isPassed: 0,
        startedAt: new Date('2025-01-12T14:15:00'),
        submittedAt: new Date('2025-01-12T14:25:00'),
        timeSpentSeconds: 600,
      },
      // Eva Mészárosová (contenders[4]) - Completed 2 tests for procedure 2
      {
        contenderId: contenders[4].id,
        surveyId: surveys[0].id,
        procedureId: procedures[1].id,
        responseData: { q1: 'answer_a', q2: 'answer_b', q3: ['answer_a', 'answer_b', 'answer_d'] },
        score: 3,
        isPassed: 1,
        startedAt: new Date('2025-01-13T11:00:00'),
        submittedAt: new Date('2025-01-13T11:17:00'),
        timeSpentSeconds: 1020,
      },
      {
        contenderId: contenders[4].id,
        surveyId: surveys[1].id,
        procedureId: procedures[1].id,
        responseData: { q1: 'answer_c', q2: 'answer_a' },
        score: 2,
        isPassed: 1,
        startedAt: new Date('2025-01-13T11:20:00'),
        submittedAt: new Date('2025-01-13T11:28:00'),
        timeSpentSeconds: 480,
      },
    ]

    const surveyResponses = await db.insert(schema.surveyResponses).values(surveyResponsesData).returning()
    console.log(`✅ Created ${surveyResponses.length} survey responses`)

    // 11. Seed Exam Scores (oral exam ratings)
    console.log('⭐ Seeding exam scores...')
    const examScoresData = [
      // Anna Nováková (contenders[0]) - High ratings
      { contenderId: contenders[0].id, criteriaId: examCriteria[0].id, score: 5, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[1].id, score: 4, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[2].id, score: 5, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[3].id, score: 4, evaluatedById: users[0].id },
      { contenderId: contenders[0].id, criteriaId: examCriteria[4].id, score: 5, evaluatedById: users[0].id },
      // Jana Kováčová (contenders[2]) - Excellent ratings
      { contenderId: contenders[2].id, criteriaId: examCriteria[0].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[1].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[2].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[3].id, score: 4, evaluatedById: users[1].id },
      { contenderId: contenders[2].id, criteriaId: examCriteria[4].id, score: 5, evaluatedById: users[1].id },
      // Eva Mészárosová (contenders[4]) - Good ratings for procedure 2
      { contenderId: contenders[4].id, criteriaId: examCriteria[5].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[6].id, score: 4, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[7].id, score: 5, evaluatedById: users[1].id },
      { contenderId: contenders[4].id, criteriaId: examCriteria[8].id, score: 4, evaluatedById: users[1].id },
    ]

    const examScores = await db.insert(schema.examScores).values(examScoresData).returning()
    console.log(`✅ Created ${examScores.length} exam scores`)

    // 11. Seed Question Battery
    console.log('❓ Seeding question battery...')
    const questionBatteryData = [
      // Samostatnosť - questions about independence and self-reliance
      { categorySlug: 'samostatnost', questionSk: 'Opíšte situáciu, keď ste museli samostatne vyriešiť zložitý problém bez pomoci nadriadených.', questionEn: 'Describe a situation where you had to independently solve a complex problem without supervisor help.', order: 1 },
      { categorySlug: 'samostatnost', questionSk: 'Ako organizujete svoju prácu, keď máte viacero dôležitých úloh naraz?', questionEn: 'How do you organize your work when you have multiple important tasks at once?', order: 2 },
      { categorySlug: 'samostatnost', questionSk: 'Povedzte nám o situácii, keď ste prevzali iniciatívu v projekte alebo úlohe.', questionEn: 'Tell us about a situation where you took initiative in a project or task.', order: 3 },
      { categorySlug: 'samostatnost', questionSk: 'Ako si stanovujete priority pri samostatnej práci?', questionEn: 'How do you set priorities when working independently?', order: 4 },

      // Komunikácia - questions about communication skills
      { categorySlug: 'komunikacia', questionSk: 'Opíšte situáciu, keď ste museli komunikovať zložité informácie občanom alebo kolegom.', questionEn: 'Describe a situation where you had to communicate complex information to citizens or colleagues.', order: 1 },
      { categorySlug: 'komunikacia', questionSk: 'Ako riešite nedorozumenia alebo konfliktné situácie v komunikácii?', questionEn: 'How do you resolve misunderstandings or conflict situations in communication?', order: 2 },
      { categorySlug: 'komunikacia', questionSk: 'Aký je váš prístup k písomnej komunikácii (emaily, správy, dokumenty)?', questionEn: 'What is your approach to written communication (emails, reports, documents)?', order: 3 },
      { categorySlug: 'komunikacia', questionSk: 'Ako prezentujete svoje návrhy a nápady kolegom alebo vedeniu?', questionEn: 'How do you present your proposals and ideas to colleagues or management?', order: 4 },

      // Analytické myslenie - questions about analytical thinking
      { categorySlug: 'analyticke_myslenie', questionSk: 'Opíšte situáciu, keď ste museli analyzovať komplexný problém a navrhnúť riešenie.', questionEn: 'Describe a situation where you had to analyze a complex problem and propose a solution.', order: 1 },
      { categorySlug: 'analyticke_myslenie', questionSk: 'Ako pristupujete k vyhodnocovaniu rôznych možností pri rozhodovaní?', questionEn: 'How do you approach evaluating different options when making decisions?', order: 2 },
      { categorySlug: 'analyticke_myslenie', questionSk: 'Povedzte nám o situácii, keď ste identifikovali problém, ktorý iní prehliadli.', questionEn: 'Tell us about a situation where you identified a problem that others overlooked.', order: 3 },
      { categorySlug: 'analyticke_myslenie', questionSk: 'Aké analytické nástroje alebo metódy používate pri riešení problémov?', questionEn: 'What analytical tools or methods do you use when solving problems?', order: 4 },

      // Flexibilita - questions about flexibility and adaptability
      { categorySlug: 'flexibilita', questionSk: 'Opíšte situáciu, keď ste sa museli rýchlo prispôsobiť zmenám v práci alebo projekte.', questionEn: 'Describe a situation where you had to quickly adapt to changes at work or in a project.', order: 1 },
      { categorySlug: 'flexibilita', questionSk: 'Ako reagujete, keď sa priority vašej práce zmenia v krátkodobom horizonte?', questionEn: 'How do you react when your work priorities change in the short term?', order: 2 },
      { categorySlug: 'flexibilita', questionSk: 'Povedzte nám o situácii, keď ste museli pracovať s novými nástrojmi alebo metódami.', questionEn: 'Tell us about a situation where you had to work with new tools or methods.', order: 3 },
      { categorySlug: 'flexibilita', questionSk: 'Ako sa vyrovnávate s neistotou a zmenami v pracovnom prostredí?', questionEn: 'How do you cope with uncertainty and changes in the work environment?', order: 4 },

      // Zodpovednosť - questions about responsibility and accountability
      { categorySlug: 'zodpovednost', questionSk: 'Opíšte situáciu, keď ste niesli zodpovednosť za dôležité rozhodnutie alebo projekt.', questionEn: 'Describe a situation where you bore responsibility for an important decision or project.', order: 1 },
      { categorySlug: 'zodpovednost', questionSk: 'Ako zabezpečujete kvalitu a presnosť svojej práce?', questionEn: 'How do you ensure the quality and accuracy of your work?', order: 2 },
      { categorySlug: 'zodpovednost', questionSk: 'Povedzte nám o situácii, keď ste urobili chybu. Ako ste ju riešili?', questionEn: 'Tell us about a situation where you made a mistake. How did you handle it?', order: 3 },
      { categorySlug: 'zodpovednost', questionSk: 'Ako sa staráte o dodržiavanie termínov a záväzkov?', questionEn: 'How do you ensure you meet deadlines and commitments?', order: 4 },

      // Kritické myslenie - questions about critical thinking
      { categorySlug: 'kriticke_myslenie', questionSk: 'Opíšte situáciu, keď ste spochybnili existujúci proces alebo postup a navrhli zlepšenie.', questionEn: 'Describe a situation where you questioned an existing process or procedure and proposed an improvement.', order: 1 },
      { categorySlug: 'kriticke_myslenie', questionSk: 'Ako overujete správnosť informácií predtým, ako ich použijete pri rozhodovaní?', questionEn: 'How do you verify the correctness of information before using it in decision-making?', order: 2 },
      { categorySlug: 'kriticke_myslenie', questionSk: 'Povedzte nám o situácii, keď ste museli vyhodnotiť viaceré protirečivé informácie.', questionEn: 'Tell us about a situation where you had to evaluate multiple conflicting pieces of information.', order: 3 },
      { categorySlug: 'kriticke_myslenie', questionSk: 'Ako identifikujete potenciálne riziká v projektoch alebo rozhodnutiach?', questionEn: 'How do you identify potential risks in projects or decisions?', order: 4 },

      // Tímová práca - questions about teamwork
      { categorySlug: 'timova_praca', questionSk: 'Opíšte úspešný projekt, na ktorom ste spolupracovali s kolegami.', questionEn: 'Describe a successful project where you collaborated with colleagues.', order: 1 },
      { categorySlug: 'timova_praca', questionSk: 'Ako prispievate k pozitívnej atmosfére v tíme?', questionEn: 'How do you contribute to a positive atmosphere in the team?', order: 2 },
      { categorySlug: 'timova_praca', questionSk: 'Povedzte nám o situácii, keď ste riešili konflikt v tíme.', questionEn: 'Tell us about a situation where you resolved a conflict in a team.', order: 3 },
      { categorySlug: 'timova_praca', questionSk: 'Aká je vaša preferovaná rola v tíme a prečo?', questionEn: 'What is your preferred role in a team and why?', order: 4 },

      // Učenlivosť - questions about learning ability
      { categorySlug: 'ucenlivost', questionSk: 'Opíšte situáciu, keď ste sa museli rýchlo naučiť novú oblasť alebo zručnosť.', questionEn: 'Describe a situation where you had to quickly learn a new area or skill.', order: 1 },
      { categorySlug: 'ucenlivost', questionSk: 'Ako sa vzdelávate a rozširujete svoje odborné znalosti?', questionEn: 'How do you educate yourself and expand your professional knowledge?', order: 2 },
      { categorySlug: 'ucenlivost', questionSk: 'Povedzte nám o situácii, keď ste aplikovali nové vedomosti v praxi.', questionEn: 'Tell us about a situation where you applied new knowledge in practice.', order: 3 },
      { categorySlug: 'ucenlivost', questionSk: 'Ako prijímate spätnú väzbu a učíte sa z chýb?', questionEn: 'How do you receive feedback and learn from mistakes?', order: 4 },

      // Motivácia - questions about motivation and drive
      { categorySlug: 'motivacia', questionSk: 'Čo vás motivuje pri práci v štátnej službe?', questionEn: 'What motivates you to work in civil service?', order: 1 },
      { categorySlug: 'motivacia', questionSk: 'Opíšte situáciu, keď ste prekročili očakávania vo svojej práci.', questionEn: 'Describe a situation where you exceeded expectations in your work.', order: 2 },
      { categorySlug: 'motivacia', questionSk: 'Ako si udržiavate motiváciu pri rutinných alebo náročných úlohách?', questionEn: 'How do you maintain motivation during routine or challenging tasks?', order: 3 },
      { categorySlug: 'motivacia', questionSk: 'Aké sú vaše profesionálne ciele a ako plánujete ich dosiahnuť?', questionEn: 'What are your professional goals and how do you plan to achieve them?', order: 4 },
    ]

    const questions = await db.insert(schema.questionBattery).values(questionBatteryData).returning()
    console.log(`✅ Created ${questions.length} questions in battery`)

    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - ${roles.length} roles`)
    console.log(`   - ${organizations.length} organizations`)
    console.log(`   - ${users.length} users`)
    console.log(`   - ${userOrganizations.length} user-organization relationships`)
    console.log(`   - ${surveys.length} surveys (written exam tests)`)
    console.log(`   - ${procedures.length} procedures`)
    console.log(`   - ${procedureSurveys.length} procedure-survey links`)
    console.log(`   - ${examCriteria.length} exam criteria (oral exam)`)
    console.log(`   - ${contenders.length} contenders`)
    console.log(`   - ${contenderFiles.length} contender files`)
    console.log(`   - ${surveyResponses.length} survey responses (completed tests)`)
    console.log(`   - ${examScores.length} exam scores (oral ratings)`)
    console.log(`   - ${questions.length} question battery items`)
    console.log('\n🔑 Staff Login (Keycloak):')
    console.log('   Email: jan.novak@mirri.gov.sk')
    console.log('   Password: password123')
    console.log('\n🎓 Test Candidate Access Codes:')
    console.log('   Anna Nováková: UC-2025-0001 (ukončené všetky testy)')
    console.log('   Peter Horváth: UC-2025-0002 (nezačaté)')
    console.log('   Jana Kováčová: UC-2025-0003 (ukončené všetky testy)')
    console.log('   Martin Szabó: UC-2025-0004 (neúspešné testy)')
    console.log('   Eva Mészárosová: UC-2025-0005 (ukončené testy)')
    console.log('   Lukáš Varga: UC-2025-0006 (nezačaté)')
    console.log('   Zuzana Molnárová: UC-2025-0007 (nezačaté)')
  }
  catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
  finally {
    await client.end()
  }
}

// Run the seeder
seed()
  .then(() => {
    console.log('👋 Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
