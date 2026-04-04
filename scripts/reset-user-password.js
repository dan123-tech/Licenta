/**
 * Reset a user's password in PostgreSQL (local/dev recovery).
 * Use when you still have DB access but forgot the password for an account (e.g. original admin).
 *
 * Usage:
 *   npm run reset-password -- <email> <new-password>
 *   node scripts/reset-user-password.js <email> <new-password>
 *
 * List enrolled users (email + company):
 *   npm run reset-password -- --list
 *
 * Requires: DATABASE_URL (from .env in project root)
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

const SALT_ROUNDS = 10;
const prisma = new PrismaClient();

async function listUsers() {
  const members = await prisma.companyMember.findMany({
    where: { status: "ENROLLED" },
    include: { user: { select: { email: true, name: true } }, company: { select: { name: true } } },
    orderBy: [{ company: { name: "asc" } }, { user: { email: "asc" } }],
  });
  console.log("ENROLLED users (email | name | company | role):\n");
  for (const m of members) {
    console.log(
      `${m.user.email} | ${m.user.name} | ${m.company.name} | ${m.role}`
    );
  }
  if (members.length === 0) console.log("(none)");
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv[0] === "--list" || argv[0] === "-l") {
    await listUsers();
    return;
  }

  const [emailRaw, newPassword] = argv;
  const email = (emailRaw || "").trim().toLowerCase();

  if (!email || !newPassword) {
    console.error(
      "Usage: npm run reset-password -- <email> <new-password>\n" +
        "       npm run reset-password -- --list\n" +
        "\nExample: npm run reset-password -- admin@company.com MyNewPass8chars"
    );
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters (same rule as registration).");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env in the project root.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email: ${email}`);
    console.error("Run: npm run reset-password -- --list");
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  });

  console.log(`Password updated for ${email}. You can log in with the new password.`);
  console.log("Other devices/sessions: log out there or wait for token expiry; web may need a fresh login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
