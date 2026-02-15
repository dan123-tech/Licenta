# Web app credentials – what to enter in Database Settings

---

## If SharePoint and AD are in Docker (your case)

The **SharePoint** and **AD** Docker containers are **SQL Server databases** that only mimic the table structure. They do **not** use Application ID, Directory ID, Client Secret, or Site URL. You **cannot** get those from Docker because those values exist only for **real** Microsoft cloud (Azure Entra, SharePoint Online).

**What to do in the web app when using the Docker databases:**

| In the app you want… | Do this in Database Settings |
|----------------------|------------------------------|
| **Users from the “AD” Docker** | Set **Users** provider to **SQL Server** (not Entra). Connect with: Host `127.0.0.1`, Port **1435**, Database **ADDirectory**, Username **sa**, Password **YourStrong!Pass123**. Set the **data table name** to **ADUsers**. |
| **Data from the “SharePoint” Docker** | Set the layer (e.g. Users/Cars/Reservations) to **SQL Server** (not SharePoint). Connect with: Host `127.0.0.1`, Port **1434**, Database **WSS_Content**, Username **sa**, Password **YourStrong!Pass123**. Choose the right table (e.g. **UserInfo**, **ListItems**, **AllLists**). |

So: **do not** choose “Microsoft Entra (AD)” or “SharePoint” when you are using the Docker SQL databases. Choose **SQL Server** and use the connection details above (see also **DBEAVER-CREDENTIALS.md**).

---

## Microsoft Entra (Azure AD) – Users layer (real cloud only)

When you set **Users** to **Microsoft Entra (AD)** in Database Settings, the app asks for:

| Field in app | What to enter | Where to get it |
|--------------|----------------|------------------|
| **Application (client) ID** | A GUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | Azure Portal → **Microsoft Entra ID** (or **Azure Active Directory**) → **App registrations** → your app → **Overview** → **Application (client) ID** |
| **Directory (tenant) ID** | A GUID like `11111111-2222-3333-4444-555555555555` | Same **Overview** page → **Directory (tenant) ID** |
| **Client Secret** | A secret value (only shown once when created) | **App registrations** → your app → **Certificates & secrets** → **New client secret** → copy the **Value** (not the Secret ID). Set an expiry (e.g. 24 months). |

### Azure steps (short)

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name (e.g. `FleetStream`), choose **Accounts in this organizational directory only**, Register.
3. **Overview**: copy **Application (client) ID** and **Directory (tenant) ID** into the app.
4. **Certificates & secrets** → **New client secret** → Description → Add → copy the **Value** into **Client Secret** in the app (you won’t see it again).
5. **API permissions**: add **Microsoft Graph** → **Application permissions** (if the app needs to read users): e.g. `User.Read.All`, `Group.Read.All`. Then **Grant admin consent** if required.

### Example (placeholders – replace with your real values)

```
Application (client) ID:  a1b2c3d4-e5f6-7890-abcd-ef1234567890
Directory (tenant) ID:   11111111-2222-3333-4444-555555555555
Client Secret:            your~secret~value~from~Azure
```

---

## SharePoint – Users / Cars / Reservations layer (real cloud only)

When you set any layer to **SharePoint** (real SharePoint Online), the app asks for:

| Field in app | What to enter | Where to get it |
|--------------|----------------|------------------|
| **Site URL** | Full SharePoint site URL | Your SharePoint site, e.g. `https://<tenant>.sharepoint.com/sites/<SiteName>`. Copy from the browser when you open the site. |
| **Client ID** | Same as Application (client) ID | Azure Portal → **App registrations** → your app → **Overview** → **Application (client) ID**. (Often the same app as for Entra, or a separate “SharePoint” app.) |
| **Client Secret** | Same as for Entra (or a dedicated secret for this app) | **App registrations** → your app → **Certificates & secrets** → **New client secret** → copy **Value**. |

### Azure steps for SharePoint

1. **App registration** (can be the same as Entra or a new one):
   - **Authentication** → **Add a platform** → **Single-page application** or **Web** if your app is server-rendered. Add redirect URI(s) your app uses.
   - **API permissions** → Add **SharePoint** → **Application permissions** (e.g. `Sites.Read.All` or `Sites.FullControl.All`) and/or **Microsoft Graph** as needed. **Grant admin consent**.
2. In **SharePoint Admin Center** (if you use SharePoint Online): ensure the app is allowed (e.g. allow apps that use OAuth).

### Example (placeholders – replace with your real values)

```
Site URL:     https://yourtenant.sharepoint.com/sites/FleetStream
Client ID:    a1b2c3d4-e5f6-7890-abcd-ef1234567890
Client Secret: your~secret~value~from~Azure
```

---

## SQL Server (Docker) – no Application ID / Client Secret

If you use the **SQL Server** provider and connect to the **Docker** databases (FleetStream, WSS_Content, ADDirectory), you do **not** use Application ID, Directory ID, or Client Secret. You use:

- **Host**, **Port**, **Database Name**, **Username**, **Password**

See **DBEAVER-CREDENTIALS.md** for those values. For **Users** with the AD-style DB, set the layer to **SQL Server** and the data table to **ADUsers** (and use the ADDirectory connection details).

---

## Summary table

| Provider | Fields you enter in the web app |
|----------|----------------------------------|
| **Entra** | Application (client) ID, Directory (tenant) ID, Client Secret |
| **SharePoint** | Site URL, Client ID, Client Secret |
| **SQL Server** | Host, Port, Database Name, Username, Password (and optionally Data table name) |

All **Entra** and **SharePoint** values come from **Azure Portal** → **App registrations** (and Site URL from your SharePoint site). Never commit real Client Secrets to git; use env vars or a secrets manager in production.
