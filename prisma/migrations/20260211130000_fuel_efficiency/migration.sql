-- AlterTable: Company default consumption (L/100km)
ALTER TABLE "Company" ADD COLUMN "defaultConsumptionL100km" DOUBLE PRECISION DEFAULT 7.5;

-- AlterTable: Car average consumption (L/100km)
ALTER TABLE "Car" ADD COLUMN "averageConsumptionL100km" DOUBLE PRECISION;
