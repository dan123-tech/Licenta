-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('Benzine', 'Diesel', 'Electric', 'Hybrid');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "averageConsumptionKwh100km" DOUBLE PRECISION,
ADD COLUMN     "batteryCapacityKwh" DOUBLE PRECISION,
ADD COLUMN     "batteryLevel" INTEGER,
ADD COLUMN     "fuelType" "FuelType" NOT NULL DEFAULT 'Benzine',
ADD COLUMN     "lastServiceMileage" INTEGER;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "priceBenzinePerLiter" DOUBLE PRECISION,
ADD COLUMN     "priceDieselPerLiter" DOUBLE PRECISION,
ADD COLUMN     "priceElectricityPerKwh" DOUBLE PRECISION;
