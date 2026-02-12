/**
 * Seed the database with: 2 admin accounts, 3 user accounts, 5 cars.
 * All users and cars belong to one company (created if needed).
 * Run: node scripts/seed-users-and-cars.js
 * Requires: DATABASE_URL in .env, migrations applied.
 */

const path = require("path");
const fs = require("fs");

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

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  console.log("Seeding: 2 admins, 3 users, 5 cars (one company)...\n");

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // 1. Get or create one company
  let company = await prisma.company.findFirst();
  if (!company) {
    let joinCode;
    let existing;
    do {
      joinCode = generateJoinCode();
      existing = await prisma.company.findUnique({ where: { joinCode } });
    } while (existing);
    company = await prisma.company.create({
      data: {
        name: "Demo Company",
        domain: "demo.example.com",
        joinCode,
        defaultKmUsage: 100,
        averageFuelPricePerLiter: 1.5,
      },
    });
    console.log("Created company:", company.name, "| Join code:", company.joinCode);
  } else {
    console.log("Using existing company:", company.name, "| Join code:", company.joinCode || "(none)");
  }

  const accounts = [
    { email: "admin1@example.com", name: "Admin One", role: "ADMIN" },
    { email: "admin2@example.com", name: "Admin Two", role: "ADMIN" },
    { email: "user1@example.com", name: "User One", role: "USER" },
    { email: "user2@example.com", name: "User Two", role: "USER" },
    { email: "user3@example.com", name: "User Three", role: "USER" },
  ];

  // 2. Create 5 users (2 ADMIN, 3 USER) and add as company members
  const users = [];
  for (const acc of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    let user;
    if (existing) {
      user = existing;
      const member = await prisma.companyMember.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: company.id } },
      });
      if (!member) {
        await prisma.companyMember.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: acc.role,
            status: "ENROLLED",
          },
        });
      }
      console.log("User already exists:", acc.email, "(" + acc.role + ")");
    } else {
      user = await prisma.user.create({
        data: {
          email: acc.email,
          password: hashedPassword,
          name: acc.name,
          drivingLicenceStatus: "APPROVED",
        },
      });
      await prisma.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: acc.role,
          status: "ENROLLED",
        },
      });
      console.log("Created:", acc.email, "(" + acc.role + ")");
    }
    users.push({ ...user, role: acc.role });
  }

  // 3. Create 5 cars for the company
  const carSpecs = [
    { brand: "Toyota", model: "Corolla", registrationNumber: "B 101 ABC" },
    { brand: "Volkswagen", model: "Golf", registrationNumber: "B 102 ABC" },
    { brand: "Ford", model: "Focus", registrationNumber: "B 103 ABC" },
    { brand: "Honda", model: "Civic", registrationNumber: "B 104 ABC" },
    { brand: "BMW", model: "320i", registrationNumber: "B 105 ABC" },
  ];

  for (const spec of carSpecs) {
    const existing = await prisma.car.findFirst({
      where: { companyId: company.id, registrationNumber: spec.registrationNumber },
    });
    if (existing) {
      console.log("Car already exists:", spec.brand, spec.registrationNumber);
    } else {
      await prisma.car.create({
        data: {
          companyId: company.id,
          brand: spec.brand,
          model: spec.model,
          registrationNumber: spec.registrationNumber,
          km: 5000 + Math.floor(Math.random() * 50000),
          status: "AVAILABLE",
        },
      });
      console.log("Created car:", spec.brand, spec.registrationNumber);
    }
  }

  console.log("\nDone.");
  console.log("Login with any of these (password: " + DEFAULT_PASSWORD + "):");
  accounts.forEach((a) => console.log("  -", a.email, "(" + a.role + ")"));
  console.log("Company join code:", company.joinCode);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
