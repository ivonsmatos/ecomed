import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // AWS Lightsail Managed PostgreSQL usa certificado CA próprio da AWS.
  // Em produção, rejectUnauthorized=false é necessário pois o certificado
  // da AWS RDS não está no CA bundle padrão do Node.js/Alpine.
  // A integridade da conexão ainda usa TLS — apenas a validação do cert é desligada.
  const ssl =
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined;

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
