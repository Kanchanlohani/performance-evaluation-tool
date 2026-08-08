import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parameters = [
  "Ownership",
  "Communication",
  "Quality of Work",
  "Problem Solving",
  "Collaboration"
];

const month = new Date("2026-08-01T00:00:00.000Z");

async function createCompany(name, users, relationships, assignments) {
  const company = await prisma.company.create({
    data: { name }
  });

  const employees = {};

  for (const user of users) {
    employees[user.key] = await prisma.employee.create({
      data: {
        companyId: company.id,
        name: user.name,
        email: user.email,
        role: user.role || "EMPLOYEE",
        title: user.title,
        password: "password"
      }
    });
  }

  for (const relation of relationships) {
    await prisma.reportingRelationship.create({
      data: {
        companyId: company.id,
        managerId: employees[relation.manager].id,
        employeeId: employees[relation.employee].id,
        startDate: new Date("2026-01-01T00:00:00.000Z")
      }
    });
  }

  const cycle = await prisma.feedbackCycle.create({
    data: {
      companyId: company.id,
      month
    }
  });

  for (const assignment of assignments) {
    const feedback = await prisma.feedback.create({
      data: {
        cycleId: cycle.id,
        reviewerId: employees[assignment.reviewer].id,
        employeeId: employees[assignment.employee].id,
        status: assignment.submitted ? "SUBMITTED" : "PENDING",
        submittedAt: assignment.submitted
          ? new Date("2026-08-05T10:00:00.000Z")
          : null
      }
    });

    if (assignment.submitted) {
      const dbParameters = await prisma.feedbackParameter.findMany({
        orderBy: {
          displayOrder: "asc"
        }
      });

      await prisma.feedbackScore.createMany({
        data: dbParameters.map((parameter, index) => ({
          feedbackId: feedback.id,
          parameterId: parameter.id,
          score: [4, 5, 4, 3, 5][index],
          reason: `Strong performance demonstrated in ${parameter.name.toLowerCase()}.`
        }))
      });
    }
  }
}

async function main() {
  await prisma.feedbackScore.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.feedbackCycle.deleteMany();
  await prisma.reportingRelationship.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.company.deleteMany();
  await prisma.feedbackParameter.deleteMany();

  for (let i = 0; i < parameters.length; i++) {
    await prisma.feedbackParameter.create({
      data: {
        name: parameters[i],
        displayOrder: i + 1
      }
    });
  }

  await createCompany(
    "Ashoka Textiles",
    [
      {
        key: "rohan",
        name: "Rohan",
        email: "rohan@ashoka.test",
        title: "Senior Manager"
      },
      {
        key: "priya",
        name: "Priya",
        email: "priya@ashoka.test",
        title: "Team Lead"
      },
      {
        key: "aditi",
        name: "Aditi",
        email: "aditi@ashoka.test",
        title: "Employee"
      },
      {
        key: "rahul",
        name: "Rahul",
        email: "rahul@ashoka.test",
        title: "Employee"
      },
      {
        key: "neha",
        name: "Neha",
        email: "neha@ashoka.test",
        title: "Employee"
      },
      {
        key: "karan",
        name: "Karan",
        email: "karan@ashoka.test",
        title: "Employee"
      },
      {
        key: "simran",
        name: "Simran",
        email: "simran@ashoka.test",
        title: "Employee"
      },
      {
        key: "meera",
        name: "Meera",
        email: "meera@ashoka.test",
        title: "Employee"
      },
      {
        key: "kavita",
        name: "Kavita",
        email: "kavita@ashoka.test",
        role: "HR",
        title: "HR Lead"
      }
    ],
    [
      { manager: "priya", employee: "aditi" },
      { manager: "priya", employee: "rahul" },
      { manager: "priya", employee: "neha" },
      { manager: "priya", employee: "karan" },
      { manager: "priya", employee: "simran" },
      { manager: "priya", employee: "meera" },
      { manager: "rohan", employee: "priya" }
    ],
    [
      { reviewer: "priya", employee: "aditi", submitted: true },
      { reviewer: "priya", employee: "rahul", submitted: true },
      { reviewer: "priya", employee: "neha", submitted: true },
      { reviewer: "priya", employee: "karan", submitted: false },
      { reviewer: "priya", employee: "simran", submitted: true },
      { reviewer: "priya", employee: "meera", submitted: true },
      { reviewer: "rohan", employee: "priya", submitted: true }
    ]
  );

  await createCompany(
    "Bright Path Consulting",
    [
      {
        key: "founder",
        name: "Founder",
        email: "founder@brightpath.test",
        title: "Founder"
      },
      {
        key: "bp1",
        name: "Employee 1",
        email: "employee1@brightpath.test"
      },
      {
        key: "bp2",
        name: "Employee 2",
        email: "employee2@brightpath.test"
      },
      {
        key: "bp3",
        name: "Employee 3",
        email: "employee3@brightpath.test"
      },
      {
        key: "bp4",
        name: "Employee 4",
        email: "employee4@brightpath.test"
      },
      {
        key: "bp5",
        name: "Employee 5",
        email: "employee5@brightpath.test"
      },
      {
        key: "bp6",
        name: "Employee 6",
        email: "employee6@brightpath.test"
      },
      {
        key: "bp7",
        name: "Employee 7",
        email: "employee7@brightpath.test"
      },
      {
        key: "bp8",
        name: "Employee 8",
        email: "employee8@brightpath.test"
      },
      {
        key: "hr",
        name: "HR",
        email: "hr@brightpath.test",
        role: "HR",
        title: "HR"
      }
    ],
    [
      { manager: "founder", employee: "bp1" },
      { manager: "founder", employee: "bp2" },
      { manager: "founder", employee: "bp3" },
      { manager: "founder", employee: "bp4" },
      { manager: "founder", employee: "bp5" },
      { manager: "founder", employee: "bp6" },
      { manager: "founder", employee: "bp7" },
      { manager: "founder", employee: "bp8" }
    ],
    [
      { reviewer: "founder", employee: "bp1", submitted: true },
      { reviewer: "founder", employee: "bp2", submitted: true },
      { reviewer: "founder", employee: "bp3", submitted: true },
      { reviewer: "founder", employee: "bp4", submitted: true },
      { reviewer: "founder", employee: "bp5", submitted: true },
      { reviewer: "founder", employee: "bp6", submitted: false },
      { reviewer: "founder", employee: "bp7", submitted: false },
      { reviewer: "founder", employee: "bp8", submitted: true }
    ]
  );

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
