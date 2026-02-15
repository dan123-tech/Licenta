-- =============================================================================
-- Active Directory / Entra-style user database schema (SQL Server)
-- For development when using an "AD" or "Entra" user source backed by SQL.
-- Run: SQLSERVER_PORT=1435 node scripts/run-ad-schema.js
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ADUsers (directory users – ObjectId, DisplayName, Mail, UPN, etc.)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ADUsers')
BEGIN
  CREATE TABLE [ADUsers] (
    [Id]                   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ObjectId]             UNIQUEIDENTIFIER NOT NULL UNIQUE DEFAULT NEWID(),
    [DisplayName]          NVARCHAR(255) NULL,
    [GivenName]            NVARCHAR(100) NULL,
    [Surname]              NVARCHAR(100) NULL,
    [Mail]                 NVARCHAR(255) NULL,
    [UserPrincipalName]   NVARCHAR(255) NOT NULL,
    [JobTitle]             NVARCHAR(255) NULL,
    [Department]           NVARCHAR(255) NULL,
    [OfficeLocation]       NVARCHAR(255) NULL,
    [MobilePhone]          NVARCHAR(50) NULL,
    [AccountEnabled]       BIT NOT NULL DEFAULT 1,
    [CreatedDateTime]      DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedDateTime]      DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [DeletedDateTime]      DATETIME2(7) NULL,
    [UserType]             NVARCHAR(50) NULL,
    [PreferredLanguage]    NVARCHAR(10) NULL
  );
  CREATE UNIQUE INDEX [IX_ADUsers_ObjectId] ON [ADUsers]([ObjectId]);
  CREATE INDEX [IX_ADUsers_UserPrincipalName] ON [ADUsers]([UserPrincipalName]);
  CREATE INDEX [IX_ADUsers_Mail] ON [ADUsers]([Mail]);
  CREATE INDEX [IX_ADUsers_DisplayName] ON [ADUsers]([DisplayName]);
  PRINT 'Table ADUsers created.';
END
GO

-- -----------------------------------------------------------------------------
-- ADGroups (directory groups – for role/group membership)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ADGroups')
BEGIN
  CREATE TABLE [ADGroups] (
    [Id]             INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ObjectId]       UNIQUEIDENTIFIER NOT NULL UNIQUE DEFAULT NEWID(),
    [DisplayName]    NVARCHAR(255) NOT NULL,
    [Description]    NVARCHAR(MAX) NULL,
    [Mail]           NVARCHAR(255) NULL,
    [MailEnabled]    BIT NOT NULL DEFAULT 0,
    [SecurityEnabled] BIT NOT NULL DEFAULT 1,
    [CreatedDateTime] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedDateTime] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [IX_ADGroups_ObjectId] ON [ADGroups]([ObjectId]);
  PRINT 'Table ADGroups created.';
END
GO

-- -----------------------------------------------------------------------------
-- ADGroupMembers (user to group membership)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ADGroupMembers')
BEGIN
  CREATE TABLE [ADGroupMembers] (
    [GroupId]   INT NOT NULL,
    [UserId]    INT NOT NULL,
    [AddedAt]   DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY ([GroupId], [UserId]),
    CONSTRAINT [FK_ADGroupMembers_Group] FOREIGN KEY ([GroupId]) REFERENCES [ADGroups]([Id]),
    CONSTRAINT [FK_ADGroupMembers_User] FOREIGN KEY ([UserId]) REFERENCES [ADUsers]([Id])
  );
  CREATE INDEX [IX_ADGroupMembers_UserId] ON [ADGroupMembers]([UserId]);
  PRINT 'Table ADGroupMembers created.';
END
GO

PRINT 'AD directory schema script completed.';
