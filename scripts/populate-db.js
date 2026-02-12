/**
 * Populate the database with seed data: 5 companies, 100 users, cars (mixed statuses), reservations.
 * Run: npm run populatedb
 * Requires: DATABASE_URL in .env, migrations applied (npx prisma migrate deploy).
 */

const path = require("path");
const fs = require("fs");

// Load .env from project root (when run via npm run, cwd is project root)
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  });
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = "password123";

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateJoinCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

const COMPANY_NAMES = ["Company Alpha", "Company Beta", "Company Gamma", "Company Delta", "Company Epsilon"];
const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Reese", "Blake", "Dakota", "Emery", "Finley", "Hayden", "Jamie", "Kai", "Logan", "Parker", "River"];
const CAR_BRANDS = ["Toyota", "Volkswagen", "Ford", "Honda", "BMW", "Mercedes", "Audi", "Hyundai", "Skoda", "Dacia"];

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  console.log("Seeding database...");

  const usedJoinCodes = new Set();
  function uniqueJoinCode() {
    let code;
    do {
      code = generateJoinCode();
    } while (usedJoinCodes.has(code));
    usedJoinCodes.add(code);
    return code;
  }

  // 1. Create 5 companies
  const companies = [];
  for (let i = 0; i < 5; i++) {
    const company = await prisma.company.create({
      data: {
        name: COMPANY_NAMES[i],
        domain: `company-${i + 1}.example.com`,
        joinCode: uniqueJoinCode(),
        defaultKmUsage: 80 + Math.floor(Math.random() * 40),
      },
    });
    companies.push(company);
    console.log(`  Company: ${company.name} (join: ${company.joinCode})`);
  }

  // 2. Create 100 users and assign to companies (20 per company), first user per company = ADMIN
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  const users = [];
  for (let u = 0; u < 100; u++) {
    const companyIndex = u % 5;
    const companyId = companies[companyIndex].id;
    const isFirstInCompany = u < 5 && companyIndex === u;
    const role = isFirstInCompany ? "ADMIN" : "USER";
    const name = `${FIRST_NAMES[u % FIRST_NAMES.length]} ${u + 1}`;
    const email = `user${u + 1}@company-${companyIndex + 1}.example.com`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        drivingLicenceStatus: u % 3 === 0 ? "APPROVED" : u % 3 === 1 ? "PENDING" : null,
      },
    });
    await prisma.companyMember.create({
      data: {
        userId: user.id,
        companyId,
        role,
        status: "ENROLLED",
      },
    });
    users.push({ ...user, companyId, role });
  }
  console.log(`  Created 100 users (20 per company, first per company = ADMIN). Password for all: ${DEFAULT_PASSWORD}`);

  // 3. Create cars per company (4–7 each), mixed statuses: AVAILABLE, RESERVED, IN_MAINTENANCE
  const allCars = [];
  for (let c = 0; c < companies.length; c++) {
    const numCars = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numCars; i++) {
      const statusRoll = Math.random();
      const status = statusRoll < 0.5 ? "AVAILABLE" : statusRoll < 0.8 ? "RESERVED" : "IN_MAINTENANCE";
      const brand = CAR_BRANDS[(c * 2 + i) % CAR_BRANDS.length];
      const car = await prisma.car.create({
        data: {
          companyId: companies[c].id,
          brand,
          model: ["Corolla", "Golf", "Focus", "Civic", "320i", "A3", "i30", "Octavia", "Sandero"][i % 9],
          registrationNumber: `B ${100 + c * 20 + i} ABC`,
          km: 5000 + Math.floor(Math.random() * 150000),
          status,
        },
      });
      allCars.push({ ...car, companyIndex: c });
    }
  }
  console.log(`  Created ${allCars.length} cars (AVAILABLE / RESERVED / IN_MAINTENANCE).`);

  // 4. Create reservations: some ACTIVE (car RESERVED), some COMPLETED, some CANCELLED
  const companyUsers = [[], [], [], [], []];
  users.forEach((u) => {
    const idx = companies.findIndex((c) => c.id === u.companyId);
    if (idx >= 0) companyUsers[idx].push(u);
  });

  let activeCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  for (let c = 0; c < companies.length; c++) {
    const companyCars = allCars.filter((car) => car.companyIndex === c);
    const reservedCars = companyCars.filter((car) => car.status === "RESERVED");
    const availableCars = companyCars.filter((car) => car.status === "AVAILABLE");
    const members = companyUsers[c].filter((m) => m.role === "USER" || m.role === "ADMIN");

    // ACTIVE reservations for cars that are RESERVED (one per reserved car)
    for (const car of reservedCars) {
      const user = members[activeCount % members.length];
      if (!user) continue;
      const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
      await prisma.reservation.create({
        data: {
          userId: user.id,
          carId: car.id,
          startDate: start,
          endDate: end,
          purpose: "Seed reservation",
          status: "ACTIVE",
        },
      });
      activeCount++;
    }

    // COMPLETED reservations (car goes back to AVAILABLE in logic; we just create past reservations)
    for (let i = 0; i < Math.min(3, availableCars.length); i++) {
      const car = availableCars[i];
      const user = members[(completedCount + i) % members.length];
      const start = new Date(Date.now() - (10 + i) * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
      const kmUsed = 30 + Math.floor(Math.random() * 120);
      await prisma.reservation.create({
        data: {
          userId: user.id,
          carId: car.id,
          startDate: start,
          endDate: end,
          purpose: "Past trip",
          status: "COMPLETED",
          releasedKmUsed: kmUsed,
          releasedExceededStatus: kmUsed > 100 ? "APPROVED" : null,
        },
      });
      completedCount++;
    }

    // CANCELLED reservations
    for (let i = 0; i < 2; i++) {
      const car = companyCars[i % companyCars.length];
      const user = members[(cancelledCount + i) % members.length];
      const start = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 1 * 24 * 60 * 60 * 1000);
      await prisma.reservation.create({
        data: {
          userId: user.id,
          carId: car.id,
          startDate: start,
          endDate: end,
          purpose: "Cancelled seed",
          status: "CANCELLED",
        },
      });
      cancelledCount++;
    }
  }

  const totalReservations = activeCount + completedCount + cancelledCount;
  console.log(`  Created ${totalReservations} reservations (ACTIVE: ${activeCount}, COMPLETED: ${completedCount}, CANCELLED: ${cancelledCount}).`);
  console.log("Done. You can log in with user1@company-1.example.com … user100@company-5.example.com, password: " + DEFAULT_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
