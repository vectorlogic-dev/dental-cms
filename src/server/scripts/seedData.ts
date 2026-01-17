import connectDB, { prisma } from '../config/database';
import { addDays, setHours, setMinutes, startOfToday, startOfWeek, addWeeks } from 'date-fns';
import { hashPassword } from '../utils/password';

const seedData = async () => {
  try {
    await connectDB();

    // Create Dentists if they don't exist
    const dentists = [
      { email: 'dr.smith@dentalcms.com', firstName: 'John', lastName: 'Smith', role: 'dentist' },
      { email: 'dr.jones@dentalcms.com', firstName: 'Sarah', lastName: 'Jones', role: 'dentist' },
      { email: 'dr.lee@dentalcms.com', firstName: 'Michael', lastName: 'Lee', role: 'dentist' },
    ];

    const dentistDocs = [];
    for (const d of dentists) {
      let doc = await prisma.user.findUnique({ where: { email: d.email } });
      if (!doc) {
        const hashedPassword = await hashPassword('password123');
        doc = await prisma.user.create({
          data: { ...d, password: hashedPassword, isActive: true },
        });
        console.log(`Created dentist: ${d.email}`);
      }
      dentistDocs.push(doc);
    }

    // Create Patients
    const patientData = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', phone: '555-0101', dateOfBirth: new Date('1990-05-15'), gender: 'female' as const, patientNumber: 'P001' },
      { firstName: 'Bob', lastName: 'Brown', email: 'bob@example.com', phone: '555-0102', dateOfBirth: new Date('1985-11-20'), gender: 'male' as const, patientNumber: 'P002' },
      { firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', phone: '555-0103', dateOfBirth: new Date('1978-02-10'), gender: 'male' as const, patientNumber: 'P003' },
      { firstName: 'Diana', lastName: 'Evans', email: 'diana@example.com', phone: '555-0104', dateOfBirth: new Date('1995-07-30'), gender: 'female' as const, patientNumber: 'P004' },
      { firstName: 'Edward', lastName: 'Frank', email: 'edward@example.com', phone: '555-0105', dateOfBirth: new Date('1962-03-25'), gender: 'male' as const, patientNumber: 'P005' },
    ];

    const patientDocs = [];
    for (const p of patientData) {
      let doc = await prisma.patient.findUnique({ where: { patientNumber: p.patientNumber } });
      if (!doc) {
        doc = await prisma.patient.create({
          data: { ...p, createdById: dentistDocs[0].id },
        });
        console.log(`Created patient: ${p.firstName} ${p.lastName}`);
      }
      patientDocs.push(doc);
    }

    // Create Appointments across multiple weeks
    const appointmentTypes = ['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up'] as const;
    const statuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] as const;

    const today = startOfToday();
    const startDate = startOfWeek(today);

    console.log('Generating appointments...');
    for (let i = 0; i < 4; i++) { // 4 weeks
      for (let day = 0; day < 5; day++) { // Mon-Fri
        const currentDay = addDays(addWeeks(startDate, i), day + 1);
        
        // 3-5 appointments per day
        const dailyCount = Math.floor(Math.random() * 3) + 3;
        for (let j = 0; j < dailyCount; j++) {
          const patient = patientDocs[Math.floor(Math.random() * patientDocs.length)];
          const dentist = dentistDocs[Math.floor(Math.random() * dentistDocs.length)];
          const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
          const hour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
          const minute = Math.random() > 0.5 ? 0 : 30;
          
          const aptDate = setMinutes(setHours(currentDay, hour), minute);

          const apt = await prisma.appointment.create({
            data: {
              patientId: patient.id,
              dentistId: dentist.id,
              appointmentDate: aptDate,
              duration: 30 + Math.floor(Math.random() * 60),
              type,
              status: statuses[Math.floor(Math.random() * statuses.length)],
              notes: `Sample appointment for ${type}`,
              createdById: dentistDocs[0].id,
            },
          });

          // If the appointment is treatment, create a corresponding treatment record
          if (type === 'treatment' || type === 'cleaning') {
            const treatmentTypes = ['Root Canal', 'Filling', 'Extraction', 'Cleaning', 'Crown', 'Bridge'];
            const tType = type === 'cleaning' ? 'Cleaning' : treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)];
            
            await prisma.treatment.create({
              data: {
                patientId: patient.id,
                appointmentId: apt.id,
                dentistId: dentist.id,
                treatmentDate: aptDate,
                treatmentType: tType,
                procedure: tType,
                cost: 100 + Math.floor(Math.random() * 900),
                paid: Math.random() > 0.5 ? 100 : 0,
                status: apt.status === 'completed' ? 'completed' : 'pending',
                notes: `Automatic treatment record for ${tType}`,
                createdById: dentistDocs[0].id,
              },
            });
          }
        }
      }
    }

    // Add additional treatments for testing
    const seededTreatments = [
      {
        patient: patientDocs[0],
        dentist: dentistDocs[0],
        treatmentDate: setMinutes(setHours(addDays(today, -2), 10), 0),
        treatmentType: 'Root Canal',
        toothNumbers: ['14'],
        diagnosis: 'Pulpitis',
        procedure: 'Root canal therapy',
        description: 'Single-visit root canal with temporary crown.',
        cost: 1200,
        paid: 1200,
        status: 'completed',
        notes: 'Seeded treatment: root canal',
      },
      {
        patient: patientDocs[1],
        dentist: dentistDocs[1],
        treatmentDate: setMinutes(setHours(addDays(today, -1), 14), 30),
        treatmentType: 'Filling',
        toothNumbers: ['3', '4'],
        diagnosis: 'Caries',
        procedure: 'Composite filling',
        description: 'Two-surface composite fillings.',
        cost: 350,
        paid: 200,
        status: 'in-progress',
        notes: 'Seeded treatment: filling',
      },
      {
        patient: patientDocs[2],
        dentist: dentistDocs[2],
        treatmentDate: setMinutes(setHours(addDays(today, 1), 9), 0),
        treatmentType: 'Extraction',
        toothNumbers: ['32'],
        diagnosis: 'Impacted wisdom tooth',
        procedure: 'Simple extraction',
        description: 'Post-op instructions provided.',
        cost: 500,
        paid: 0,
        status: 'pending',
        notes: 'Seeded treatment: extraction',
      },
      {
        patient: patientDocs[3],
        dentist: dentistDocs[0],
        treatmentDate: setMinutes(setHours(addDays(today, 3), 11), 0),
        treatmentType: 'Cleaning',
        toothNumbers: ['11', '12', '21', '22'],
        diagnosis: 'Gingivitis',
        procedure: 'Prophylaxis',
        description: 'Full mouth scaling and polishing.',
        cost: 180,
        paid: 180,
        status: 'completed',
        notes: 'Seeded treatment: cleaning',
      },
      {
        patient: patientDocs[4],
        dentist: dentistDocs[1],
        treatmentDate: setMinutes(setHours(addDays(today, 4), 15), 0),
        treatmentType: 'Crown',
        toothNumbers: ['19'],
        diagnosis: 'Cracked tooth',
        procedure: 'Crown preparation',
        description: 'Temporary crown placed; lab order sent.',
        cost: 900,
        paid: 300,
        status: 'in-progress',
        notes: 'Seeded treatment: crown prep',
      },
      {
        patient: patientDocs[0],
        dentist: dentistDocs[2],
        treatmentDate: setMinutes(setHours(addDays(today, 7), 13), 0),
        treatmentType: 'Bridge',
        toothNumbers: ['5', '6', '7'],
        diagnosis: 'Missing tooth',
        procedure: 'Bridge consult',
        description: 'Consultation and treatment planning.',
        cost: 150,
        paid: 0,
        status: 'cancelled',
        notes: 'Seeded treatment: bridge consult',
      },
    ];

    for (const t of seededTreatments) {
      const exists = await prisma.treatment.findFirst({
        where: {
          patientId: t.patient.id,
          treatmentDate: t.treatmentDate,
          treatmentType: t.treatmentType,
          procedure: t.procedure,
          notes: t.notes,
        },
      });

      if (!exists) {
        await prisma.treatment.create({
          data: {
            patientId: t.patient.id,
            dentistId: t.dentist.id,
            treatmentDate: t.treatmentDate,
            treatmentType: t.treatmentType,
            toothNumbers: Array.isArray(t.toothNumbers) ? t.toothNumbers.join(', ') : t.toothNumbers,
            diagnosis: t.diagnosis,
            procedure: t.procedure,
            description: t.description,
            cost: t.cost,
            paid: t.paid,
            status: t.status,
            notes: t.notes,
            createdById: dentistDocs[0].id,
          },
        });
      }
    }

    console.log('Seeding completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedData();
