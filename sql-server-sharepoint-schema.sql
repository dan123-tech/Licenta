-- =============================================================================
-- SharePoint-style content database schema (SQL Server)
-- For development / testing when using a "SharePoint" data source.
-- Run: SQLSERVER_PORT=1434 node scripts/run-sharepoint-schema.js
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Sites (site collections)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sites')
BEGIN
  CREATE TABLE [Sites] (
    [Id]          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [Url]         NVARCHAR(2048) NOT NULL,
    [OwnerId]     INT NULL,
    [Language]    INT NOT NULL DEFAULT 1033,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [Deleted]     BIT NOT NULL DEFAULT 0
  );
  CREATE INDEX [IX_Sites_Url] ON [Sites]([Url]);
  PRINT 'Table Sites created.';
END
GO

-- -----------------------------------------------------------------------------
-- Webs (sites within a site collection)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Webs')
BEGIN
  CREATE TABLE [Webs] (
    [Id]          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [SiteId]      UNIQUEIDENTIFIER NOT NULL,
    [FullUrl]     NVARCHAR(2048) NOT NULL,
    [Title]       NVARCHAR(255) NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Language]    INT NOT NULL DEFAULT 1033,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [Deleted]     BIT NOT NULL DEFAULT 0,
    CONSTRAINT [FK_Webs_Sites] FOREIGN KEY ([SiteId]) REFERENCES [Sites]([Id])
  );
  CREATE INDEX [IX_Webs_SiteId] ON [Webs]([SiteId]);
  CREATE INDEX [IX_Webs_FullUrl] ON [Webs]([FullUrl]);
  PRINT 'Table Webs created.';
END
GO

-- -----------------------------------------------------------------------------
-- UserInfo (users with access to a site – SharePoint-style)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserInfo')
BEGIN
  CREATE TABLE [UserInfo] (
    [tp_ID]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [tp_SiteID]       UNIQUEIDENTIFIER NOT NULL,
    [tp_Login]        NVARCHAR(255) NOT NULL,
    [tp_Email]        NVARCHAR(255) NULL,
    [tp_Title]        NVARCHAR(255) NULL,
    [tp_Deleted]      BIT NOT NULL DEFAULT 0,
    [tp_IsSiteAdmin]  BIT NOT NULL DEFAULT 0,
    [tp_PrincipalType] INT NOT NULL DEFAULT 1,
    [tp_SystemID]    UNIQUEIDENTIFIER NULL,
    [tp_Modified]    DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [tp_Created]      DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_UserInfo_tp_SiteID] ON [UserInfo]([tp_SiteID]);
  CREATE INDEX [IX_UserInfo_tp_Login] ON [UserInfo]([tp_Login]);
  CREATE INDEX [IX_UserInfo_tp_Email] ON [UserInfo]([tp_Email]);
  PRINT 'Table UserInfo created.';
END
GO

-- -----------------------------------------------------------------------------
-- Groups (SharePoint groups per site)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Groups')
BEGIN
  CREATE TABLE [Groups] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SiteId]      UNIQUEIDENTIFIER NOT NULL,
    [Name]        NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [OwnerId]     INT NULL,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [Deleted]     BIT NOT NULL DEFAULT 0
  );
  CREATE INDEX [IX_Groups_SiteId] ON [Groups]([SiteId]);
  PRINT 'Table Groups created.';
END
GO

-- -----------------------------------------------------------------------------
-- GroupMembership (user ↔ group)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GroupMembership')
BEGIN
  CREATE TABLE [GroupMembership] (
    [GroupId] INT NOT NULL,
    [UserId]  INT NOT NULL,
    [Created] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY ([GroupId], [UserId])
  );
  CREATE INDEX [IX_GroupMembership_UserId] ON [GroupMembership]([UserId]);
  PRINT 'Table GroupMembership created.';
END
GO

-- -----------------------------------------------------------------------------
-- Roles (permission levels)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
  CREATE TABLE [Roles] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [WebId]       UNIQUEIDENTIFIER NOT NULL,
    [Name]        NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Mask]        BIGINT NOT NULL DEFAULT 0,
    [Type]        INT NOT NULL DEFAULT 0
  );
  CREATE INDEX [IX_Roles_WebId] ON [Roles]([WebId]);
  PRINT 'Table Roles created.';
END
GO

-- -----------------------------------------------------------------------------
-- RoleAssignment (principal ↔ role)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoleAssignment')
BEGIN
  CREATE TABLE [RoleAssignment] (
    [Id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SiteId]     UNIQUEIDENTIFIER NOT NULL,
    [ScopeId]    UNIQUEIDENTIFIER NOT NULL,
    [PrincipalId] INT NOT NULL,
    [RoleId]     INT NOT NULL,
    [Created]    DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_RoleAssignment_PrincipalId] ON [RoleAssignment]([PrincipalId]);
  CREATE INDEX [IX_RoleAssignment_ScopeId] ON [RoleAssignment]([ScopeId]);
  PRINT 'Table RoleAssignment created.';
END
GO

-- -----------------------------------------------------------------------------
-- AllLists (list definitions per web)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AllLists')
BEGIN
  CREATE TABLE [AllLists] (
    [tp_ID]              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [tp_WebId]           UNIQUEIDENTIFIER NOT NULL,
    [tp_Title]           NVARCHAR(255) NOT NULL,
    [tp_Description]     NVARCHAR(MAX) NULL,
    [tp_ServerTemplate]  INT NOT NULL DEFAULT 100,
    [tp_BaseType]        INT NOT NULL DEFAULT 0,
    [tp_ItemCount]       INT NOT NULL DEFAULT 0,
    [tp_Hidden]          BIT NOT NULL DEFAULT 0,
    [tp_Deleted]         BIT NOT NULL DEFAULT 0,
    [tp_Created]         DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [tp_Modified]        DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_AllLists_tp_WebId] ON [AllLists]([tp_WebId]);
  PRINT 'Table AllLists created.';
END
GO

-- -----------------------------------------------------------------------------
-- AllUserData (list item / document metadata – generic key/value style)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AllUserData')
BEGIN
  CREATE TABLE [AllUserData] (
    [tp_ID]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [tp_ListId]       UNIQUEIDENTIFIER NOT NULL,
    [tp_SiteId]       UNIQUEIDENTIFIER NOT NULL,
    [tp_WebId]        UNIQUEIDENTIFIER NOT NULL,
    [tp_Author]       INT NULL,
    [tp_Editor]       INT NULL,
    [tp_Modified]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [tp_Created]       DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [tp_DeleteTransactionId] INT NULL,
    [tp_Level]        TINYINT NOT NULL DEFAULT 1,
    [tp_IsCurrentVersion] BIT NOT NULL DEFAULT 1
  );
  CREATE INDEX [IX_AllUserData_tp_ListId] ON [AllUserData]([tp_ListId]);
  CREATE INDEX [IX_AllUserData_tp_SiteId] ON [AllUserData]([tp_SiteId]);
  CREATE INDEX [IX_AllUserData_tp_Modified] ON [AllUserData]([tp_Modified]);
  PRINT 'Table AllUserData created.';
END
GO

-- -----------------------------------------------------------------------------
-- AllDocs (documents and list items – file/list row reference)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AllDocs')
BEGIN
  CREATE TABLE [AllDocs] (
    [Id]              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [SiteId]          UNIQUEIDENTIFIER NOT NULL,
    [WebId]           UNIQUEIDENTIFIER NOT NULL,
    [ListId]          UNIQUEIDENTIFIER NOT NULL,
    [DirName]         NVARCHAR(256) NOT NULL,
    [LeafName]        NVARCHAR(256) NOT NULL,
    [Size]            BIGINT NOT NULL DEFAULT 0,
    [TimeCreated]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [TimeLastModified] DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [ItemId]          INT NULL,
    [Deleted]         BIT NOT NULL DEFAULT 0,
    [ContentType]     NVARCHAR(255) NULL
  );
  CREATE INDEX [IX_AllDocs_SiteId] ON [AllDocs]([SiteId]);
  CREATE INDEX [IX_AllDocs_ListId] ON [AllDocs]([ListId]);
  CREATE INDEX [IX_AllDocs_DirName] ON [AllDocs]([DirName], [LeafName]);
  PRINT 'Table AllDocs created.';
END
GO

-- -----------------------------------------------------------------------------
-- DocStreams (binary content for documents – optional)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocStreams')
BEGIN
  CREATE TABLE [DocStreams] (
    [Id]     UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [Content] VARBINARY(MAX) NULL,
    CONSTRAINT [FK_DocStreams_AllDocs] FOREIGN KEY ([Id]) REFERENCES [AllDocs]([Id])
  );
  PRINT 'Table DocStreams created.';
END
GO

-- -----------------------------------------------------------------------------
-- Features (activated features per site/web)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Features')
BEGIN
  CREATE TABLE [Features] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SiteId]      UNIQUEIDENTIFIER NULL,
    [WebId]       UNIQUEIDENTIFIER NULL,
    [FeatureId]   UNIQUEIDENTIFIER NOT NULL,
    [Version]     BIGINT NULL,
    [Activated]   DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_Features_SiteId] ON [Features]([SiteId]);
  CREATE INDEX [IX_Features_WebId] ON [Features]([WebId]);
  PRINT 'Table Features created.';
END
GO

-- -----------------------------------------------------------------------------
-- ImmedSubscriptions (alerts – immediate notifications)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImmedSubscriptions')
BEGIN
  CREATE TABLE [ImmedSubscriptions] (
    [Id]          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [SiteId]      UNIQUEIDENTIFIER NOT NULL,
    [UserId]      INT NOT NULL,
    [ListId]      UNIQUEIDENTIFIER NULL,
    [AlertTitle]  NVARCHAR(255) NULL,
    [DeliveryChannel] INT NOT NULL DEFAULT 0,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_ImmedSubscriptions_UserId] ON [ImmedSubscriptions]([UserId]);
  PRINT 'Table ImmedSubscriptions created.';
END
GO

-- -----------------------------------------------------------------------------
-- SchedSubscriptions (scheduled alerts)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SchedSubscriptions')
BEGIN
  CREATE TABLE [SchedSubscriptions] (
    [Id]          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [SiteId]      UNIQUEIDENTIFIER NOT NULL,
    [UserId]      INT NOT NULL,
    [Schedule]    NVARCHAR(100) NULL,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE INDEX [IX_SchedSubscriptions_UserId] ON [SchedSubscriptions]([UserId]);
  PRINT 'Table SchedSubscriptions created.';
END
GO

-- -----------------------------------------------------------------------------
-- ListItems (simplified list rows – title, etc.)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ListItems')
BEGIN
  CREATE TABLE [ListItems] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ListId]      UNIQUEIDENTIFIER NOT NULL,
    [WebId]       UNIQUEIDENTIFIER NOT NULL,
    [Title]       NVARCHAR(255) NULL,
    [AuthorId]    INT NULL,
    [EditorId]    INT NULL,
    [Created]     DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [Modified]    DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    [Deleted]     BIT NOT NULL DEFAULT 0
  );
  CREATE INDEX [IX_ListItems_ListId] ON [ListItems]([ListId]);
  PRINT 'Table ListItems created.';
END
GO

PRINT 'SharePoint-style schema script completed.';
