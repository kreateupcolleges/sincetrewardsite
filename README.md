
# Student Reward & Assessment Portal (React + Google Sheets)

A highly scalable, open-source web portal designed for educational institutions to track student performance, reward points, and internal assessment marks. The system operates serverlessly by fetching data directly from Google Sheets, making it easy to maintain without backend infrastructure.

## 🚀 Key Features

*   **Serverless Architecture**: Uses Google Sheets as the database.
*   **Role-Based Access**:
    *   **Student View**: Publicly accessible search to view individual performance.
    *   **Admin Portal**: Secure login (via Google Sheet credentials) to view executive dashboards and analytics.
*   **Scalable Configuration**: Easily adaptable for any college by updating a single config file.
*   **Analytics**: Visual charts for subject performance, activity participation, and pass percentages.
*   **Dark Mode**: Built-in theme support.
*   **Mobile Responsive**: Optimized for phones and tablets.

---

## 🛠️ Configuration Guide (For Other Colleges)

To adapt this portal for your institution, you only need to modify **`config.ts`**.

### 1. Branding & Logo
Open `config.ts` and update the `INSTITUTION_CONFIG` section.

```typescript
export const INSTITUTION_CONFIG = {
  name: "My College Name", 
  logoUrl: "https://your-logo-url.com/logo.png" 
};
```
*Tip: If your logo is on Google Drive, use a direct link generator or the format: `https://drive.google.com/uc?export=view&id=YOUR_FILE_ID`.*

### 2. Admin Authentication
1.  Create a Google Sheet named `Admin_Credentials`.
2.  Add columns: `Email`, `Password`, `Name`, `Department`.
3.  Add authorized users to this sheet.
4.  Make the sheet **Publicly Viewable** (Viewer access).
5.  Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`).
6.  Update `ADMIN_AUTH_CONFIG` in `config.ts`:

```typescript
export const ADMIN_AUTH_CONFIG = {
  id: "YOUR_SHEET_ID",
  name: "Admin_Credentials" // The tab name
};
```

### 3. Academic Batches & Subjects
All academic data logic resides in the `BATCHES` array in `config.ts`.

#### Adding a New Batch
```typescript
{
  id: 'batch-2024-2028',
  label: 'Batch 2024 - 2028',
  rewardSheets: { ... },
  internalMarksSheets: { ... },
  semesters: { ... },
  subjectConfig: { ... }
}
```

#### Mapping Google Sheets
For every internal exam (e.g., "IP1", "Mid-Sem"), you need to map the Google Sheet ID for the *Reward Points* and *Internal Marks*.

**Important**: 
*   Google Sheets must be set to **"Anyone with the link can view"**.
*   The `name` property in config must match the **Tab Name** at the bottom of the Google Sheet exactly.

---

## 💻 Installation & Local Development

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/rcs-portal.git
    cd rcs-portal
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    # or
    npm start
    ```
    The app will open at `http://localhost:3000`.

---

## 🌐 Deployment (GitHub Pages)

This project is pre-configured for deployment to GitHub Pages.

1.  **Update `package.json`**
    Change the `homepage` field to your repository URL:
    ```json
    "homepage": "https://<your-github-username>.github.io/<repo-name>",
    ```

2.  **Deploy**
    Run the deployment script:
    ```bash
    npm run deploy
    ```
    This will build the project and push it to the `gh-pages` branch.

3.  **Activate in GitHub**
    Go to your Repository Settings > Pages > Source, and select `gh-pages` branch.

---

## 📁 Project Structure

*   **`config.ts`**: The heart of the application. Contains all settings for Sheets, Batches, Subjects, and Branding.
*   **`theme.ts`**: Centralized color palette and styling constants (Tailwind classes).
*   **`services/sheetService.ts`**: Handles data fetching and parsing from Google Sheets.
*   **`components/`**: React components for various dashboards and tables.
    *   `AdminPortal.tsx`: The secure dashboard for staff.
    *   `StudentAnalytics.tsx`: Charts and graphs for performance.

---

## 🔒 Security Note
Since this is a client-side application using public Google Sheets:
1.  **Do not store sensitive personal data** (like phone numbers or home addresses) in the public sheets if strict privacy is required.
2.  The "Admin Login" provides UI-level access control. A determined user with technical skills could inspect the network traffic to find the Sheet IDs. Ensure your internal marks sheets do not contain confidential comments.

