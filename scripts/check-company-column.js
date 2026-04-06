const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Company' AND column_name = 'dataSourceSetupCompletedAt'`
  .then((r) => {
    console.log("dataSourceSetupCompletedAt present:", r.length > 0);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return p.$disconnect();
  });
