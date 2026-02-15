-- =============================================================================
-- FleetStream / Company Car Sharing – SQL Server schema for the whole app
-- =============================================================================
--
-- How to use:
-- 1. Run: node scripts/run-sqlserver-schema.js  (creates database FleetStream and all tables there)
--    OR create database FleetStream and run this script in that database (SSMS, DBeaver, sqlcmd).
-- 2. Tables (Car, Cars, Users, Reservation, etc.) are in database FLEETSTREAM, not master.
--    In DBeaver: expand your connection → Databases → FleetStream → Tables.
-- 3. In the app: Database Settings → Connect with Database name = FleetStream (not master).
-- 4. For Users layer: choose table "Users".
--    For Cars layer:    choose table "Car" or "Cars".
--    For Reservations:  choose table "Reservation".
--
-- Note: The app currently uses SQL Server for the Users layer (listing members).
--       Cars and Reservations layers may still use Local (Prisma) unless you
--       add SQL Server connectors for them; these tables are ready when you do.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Users (for Database Settings → Users layer → SQL Server)
-- Map this table in "Select Data Table" as the Users table.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
  CREATE TABLE [Users] (
    [Id]           INT IDENTITY(1,1) PRIMARY KEY,
    [Email]        NVARCHAR(255) NOT NULL UNIQUE,
    [Name]         NVARCHAR(255) NOT NULL,
    [PasswordHash] NVARCHAR(255) NULL,
    [Role]         NVARCHAR(50)  NOT NULL DEFAULT 'USER',
    [Status]       NVARCHAR(50)  NOT NULL DEFAULT 'enrolled',
    [Active]       BIT           NOT NULL DEFAULT 1,
    [DrivingLicenceUrl]    NVARCHAR(2048) NULL,
    [DrivingLicenceStatus] NVARCHAR(50)  NULL,
    [CreatedAt]    DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]    DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Users_Email] ON [Users]([Email]);
  PRINT 'Table Users created.';
END
GO

-- -----------------------------------------------------------------------------
-- 2. Company (tenant/organization)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Company')
BEGIN
  CREATE TABLE [Company] (
    [Id]                        NVARCHAR(50) PRIMARY KEY,
    [Name]                      NVARCHAR(255) NOT NULL,
    [Domain]                    NVARCHAR(255) NULL,
    [JoinCode]                  NVARCHAR(50)  NULL UNIQUE,
    [DefaultKmUsage]            INT           NOT NULL DEFAULT 100,
    [AverageFuelPricePerLiter]  FLOAT(53)     NULL,
    [DefaultConsumptionL100km]  FLOAT(53)     NULL DEFAULT 7.5,
    [PriceBenzinePerLiter]      FLOAT(53)     NULL,
    [PriceDieselPerLiter]       FLOAT(53)     NULL,
    [PriceElectricityPerKwh]    FLOAT(53)     NULL,
    [DataSourceConfig]          NVARCHAR(MAX) NULL,
    [DataSourceCredentials]     NVARCHAR(MAX) NULL,
    [CreatedAt]                 DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]                 DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Company_JoinCode] ON [Company]([JoinCode]);
  PRINT 'Table Company created.';
END
GO

-- -----------------------------------------------------------------------------
-- 3. CompanyMember (user ↔ company, role, status)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CompanyMember')
BEGIN
  CREATE TABLE [CompanyMember] (
    [Id]        NVARCHAR(50) PRIMARY KEY,
    [UserId]    NVARCHAR(50) NOT NULL,
    [CompanyId] NVARCHAR(50) NOT NULL,
    [Role]      NVARCHAR(20) NOT NULL DEFAULT 'USER',
    [Status]    NVARCHAR(30) NOT NULL DEFAULT 'PENDING_INVITE',
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [UQ_CompanyMember_UserId_CompanyId] UNIQUE ([UserId], [CompanyId])
  );
  CREATE INDEX [IX_CompanyMember_CompanyId] ON [CompanyMember]([CompanyId]);
  CREATE INDEX [IX_CompanyMember_UserId]   ON [CompanyMember]([UserId]);
  PRINT 'Table CompanyMember created.';
END
GO

-- -----------------------------------------------------------------------------
-- 4. Invite (invitation token to join a company)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invite')
BEGIN
  CREATE TABLE [Invite] (
    [Id]        NVARCHAR(50) PRIMARY KEY,
    [Token]     NVARCHAR(100) NOT NULL UNIQUE,
    [Email]     NVARCHAR(255) NOT NULL,
    [CompanyId] NVARCHAR(50)  NOT NULL,
    [ExpiresAt] DATETIME2(7)  NOT NULL,
    [UsedAt]    DATETIME2(7)  NULL,
    [CreatedAt] DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Invite_Token]     ON [Invite]([Token]);
  CREATE INDEX [IX_Invite_CompanyId] ON [Invite]([CompanyId]);
  PRINT 'Table Invite created.';
END
GO

-- -----------------------------------------------------------------------------
-- 5a. Car (for Database Settings → Cars layer → SQL Server)
-- Same structure as PostgreSQL Car: id, companyId, brand, model, etc.
-- Use table name "Car" in the app when connecting.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Car')
BEGIN
  CREATE TABLE [Car] (
    [id]                         NVARCHAR(50)  NOT NULL PRIMARY KEY,
    [companyId]                  NVARCHAR(50)  NOT NULL,
    [brand]                      NVARCHAR(100) NOT NULL,
    [model]                      NVARCHAR(100) NULL,
    [registrationNumber]         NVARCHAR(50)  NOT NULL,
    [km]                         INT           NOT NULL DEFAULT 0,
    [status]                     NVARCHAR(30)  NOT NULL DEFAULT 'AVAILABLE',
    [createdAt]                  DATETIME2(3)  NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]                  DATETIME2(3)  NOT NULL DEFAULT GETUTCDATE(),
    [averageConsumptionL100km]   FLOAT(53)     NULL,
    [averageConsumptionKwh100km] FLOAT(53)     NULL,
    [batteryCapacityKwh]         FLOAT(53)     NULL,
    [batteryLevel]               INT           NULL,
    [fuelType]                   NVARCHAR(20)  NOT NULL DEFAULT 'Benzine',
    [lastServiceMileage]         INT           NULL
  );
  CREATE INDEX [IX_Car_companyId] ON [Car]([companyId]);
  CREATE INDEX [IX_Car_status]    ON [Car]([status]);
  PRINT 'Table Car created.';
END
GO

-- -----------------------------------------------------------------------------
-- 5b. Cars (alternative name; same structure – use "Cars" in the app if preferred)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cars')
BEGIN
  CREATE TABLE [Cars] (
    [Id]                        NVARCHAR(50) PRIMARY KEY,
    [CompanyId]                 NVARCHAR(50)  NOT NULL,
    [Brand]                     NVARCHAR(100) NOT NULL,
    [Model]                     NVARCHAR(100) NULL,
    [RegistrationNumber]        NVARCHAR(50)  NOT NULL,
    [Km]                        INT           NOT NULL DEFAULT 0,
    [Status]                    NVARCHAR(30)  NOT NULL DEFAULT 'AVAILABLE',
    [FuelType]                  NVARCHAR(20)  NOT NULL DEFAULT 'Benzine',
    [AverageConsumptionL100km]  FLOAT(53)     NULL,
    [AverageConsumptionKwh100km] FLOAT(53)     NULL,
    [BatteryLevel]              INT           NULL,
    [BatteryCapacityKwh]        FLOAT(53)     NULL,
    [LastServiceMileage]        INT           NULL,
    [CreatedAt]                 DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]                 DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Cars_CompanyId] ON [Cars]([CompanyId]);
  CREATE INDEX [IX_Cars_Status]    ON [Cars]([Status]);
  PRINT 'Table Cars created.';
END
GO

-- -----------------------------------------------------------------------------
-- 6. Reservation (for Database Settings → Reservations layer → SQL Server)
-- Map this table in "Select Data Table" as the Reservations table.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservation')
BEGIN
  CREATE TABLE [Reservation] (
    [Id]                         NVARCHAR(50) PRIMARY KEY,
    [UserId]                     NVARCHAR(50)  NOT NULL,
    [CarId]                      NVARCHAR(50)  NOT NULL,
    [StartDate]                  DATETIME2(7)  NOT NULL,
    [EndDate]                    DATETIME2(7)  NOT NULL,
    [Purpose]                    NVARCHAR(500) NULL,
    [Status]                     NVARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    [Pickup_code]                NVARCHAR(20)  NULL,
    [Code_valid_from]            DATETIME2(7)  NULL,
    [Release_code]               NVARCHAR(20)  NULL,
    [ReleasedKmUsed]              INT           NULL,
    [ReleasedExceededReason]     NVARCHAR(500) NULL,
    [ReleasedExceededStatus]     NVARCHAR(30)  NULL,
    [ReleasedExceededAdminComment] NVARCHAR(MAX) NULL,
    [CreatedAt]                  DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt]                  DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Reservation_CarId]     ON [Reservation]([CarId]);
  CREATE INDEX [IX_Reservation_UserId]    ON [Reservation]([UserId]);
  CREATE INDEX [IX_Reservation_StartEnd]   ON [Reservation]([StartDate], [EndDate]);
  PRINT 'Table Reservation created.';
END
GO

-- -----------------------------------------------------------------------------
-- Optional: Sample rows for testing (uncomment if needed)
-- -----------------------------------------------------------------------------
/*
INSERT INTO [Users] ([Email], [Name], [Role], [Status], [Active])
VALUES
  (N'admin@company.com', N'Administrator', N'ADMIN', N'enrolled', 1),
  (N'user@company.com', N'Test User', N'USER', N'enrolled', 1);
*/

PRINT 'Schema script completed.';
