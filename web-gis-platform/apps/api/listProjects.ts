import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, createdAt: true }
  });
  console.log("PROJECTS_LIST_START");
  console.log(JSON.stringify(projects, null, 2));
  console.log("PROJECTS_LIST_END");
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
