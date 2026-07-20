
import { BatchConfig } from './types';

/**
 * ============================================================================
 *  INSTITUTION CONFIGURATION
 *  Update this section to customize the portal for your college.
 * ============================================================================
 */
export const INSTITUTION_CONFIG = {
  // Display Name appearing in the Header
  name: "SINCET Reward Points Site", 
  
  // URL to the college logo (Direct link to image)
logoUrl: "https://drive.google.com/file/d/1MZ0D4J4Ys7eVMk1762xFt0OMAonZdqKO/view?usp=sharing"
};

/**
 *  ADMIN AUTHENTICATION SHEET
 *  Sheet containing columns: Email Address, Password, Name, Department
 */
export const ADMIN_AUTH_CONFIG = {
  id: "1rMnQAaMMdXn_5GJtISZTQpNrLhxv29M61fbpfvu25UE",
  name: "Admin_Credentials"
};

/**
 *  ELITE STUDENT AUTHENTICATION SHEET
 *  Sheet containing columns: Email Address, Name, Register No, Department, Password
 */
export const ELITE_AUTH_CONFIG = {
  id: "1nIkD73XZ9uykJ_LRJM0GGBJCd73nUh0_xf2-_PGKeVI",
  name: "Sheet1" 
};


/**
 * ============================================================================
 *  ACADEMIC DATA CONFIGURATION
 *  Manage Sheets, Batches, and Subject Definitions here.
 * ============================================================================
 */

export const BATCHES: BatchConfig[] = [
  // --------------------------------------------------------------------------
  // BATCH 1: 2025 - 2028 (1st Year)
  // --------------------------------------------------------------------------
  {
    id: 'batch-2025-2029',
    label: 'Batch 2025 - 2029 (1st Year)',
    semesters: {
      "1": { 
        label: "Semester 2", 
        internals: ["IP1", "IP2"],
        
        // --- SEMESTER 1 SHEETS ---
        rewardSheets: {
          IP1: { id: "1YJQqB6ts5JvxL4r9FoJWvKUPNFJnI25xPByMp4Pjdhw", name: "SINCET_B25-29_S2_IP1&2_RewardsSplit" }
          // IP2: { id: "1cJc1Vc2PSAo6hUlGJSX_8R4jUnjzHA", name: "RCS_1styear_IP2_RewardsSplit" }
        },
        
        internalMarksSheets: {
          IP1: {
            "MECH": { id: "1sFa25BZDjcdSg0hlixc1g9Nc-2QAmqFodqmbbLBPax4", name: "MECH" },
            "AIDS": { id: "129zH9nKkd5Veoh4XhzaGENz390AXk1rxPBN_PG3EkNE", name: "AIDS" },
            "CSE": { id: "14kwixr135-I9iqgA1vM4lml-U1Mo9CIKPgnfCNcLKYY", name: "CSE" },
            "ECE": { id: "1mdajVYX0uEyKPbYTdcrrgs3joNFKXKZJ-zAVKtqO8ZE", name: "ECE" },
            "IT": { id: "1vF33LYERn0QlcHnZMpPOE2sEmhv1Z88f-CjCmzPMo1I", name: "IT" },
            "AIML": { id: "1uqX_lVAjrzprCmjAMJ7kbZK1wlwVZzu1U88ZMshgr8I", name: "AIML" }
          }
          // IP2: {
          //   "B.Sc  AIML": { id: "1eHcJZfwa8DaQLH_mxp4", name: "B.Sc  AIML" },
          //   "B.Sc  CS with AI": { id: "1Z1iK7UpChhf4p5oDar2mhStX96s", name: "B.Sc  CS with AI" },
          //   "B.Sc CS": { id: "1w-9Nxy6X1pMTBU8YTOXozsU", name: "B.Sc CS" },
          //   "B.Sc DCFS": { id: "1sUdFzj8_LXMntv6tQgjy94rM", name: "B.Sc DCFS" },
          //   "B.Sc DS": { id: "1usnswuhn5chnx58-XioTEk", name: "B.Sc DS" },
          //   "B.Sc DSA": { id: "1v_ucgOpVWSYV50Z1Kiln_r593pg", name: "B.Sc DSA" },
          //   "B.Sc IT": { id: "1BZ9VS712RmFe9X8HKAzoacym4", name: "B.Sc IT" }
          // }
        },

        // --- SEMESTER 1 SUBJECTS ---
        subjectConfig: {
          defaultMaxMarks: {
            Theory: 16,
            Lab: 16,
            "Lab+Theory": 16
          },
          departments: {
"MECH": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "EE25C01", type: "Theory", maxMarks: 16 },
  { code: "ME25C02", type: "Theory", maxMarks: 16 },
  { code: "PH25C05", type: "Theory", maxMarks: 16 },
  { code: "CY25C03", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 }
],

"CSE": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "EE25C01", type: "Theory", maxMarks: 16 },
  { code: "CS25C06", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "PH25C03", type: "Theory", maxMarks: 16 },
  { code: "CS25C07", type: "Lab+Theory", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 }
],

"IT": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "EE25C01", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "PH25C03", type: "Theory", maxMarks: 16 },
  { code: "IT25201", type: "Lab+Theory", maxMarks: 16 },
  { code: "IT25202", type: "Lab+Theory", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 }
],

"AIDS": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "EE25C01", type: "Theory", maxMarks: 16 },
  { code: "CS25C06", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "PH25C03", type: "Theory", maxMarks: 16 },
  { code: "AD25201", type: "Lab+Theory", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 }
],

"AIML": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "EE25C01", type: "Theory", maxMarks: 16 },
  { code: "CS25C06", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "PH25C03", type: "Theory", maxMarks: 16 },
  { code: "CS25C07", type: "Lab+Theory", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 }
],

"ECE": [
  { code: "MA25C02", type: "Theory", maxMarks: 16 },
  { code: "UC25H02", type: "Theory", maxMarks: 16 },
  { code: "EN25C02", type: "Lab+Theory", maxMarks: 16 },
  { code: "EC25C01", type: "Theory", maxMarks: 16 },
  { code: "EC25C02", type: "Theory", maxMarks: 16 },
  { code: "CS25C05", type: "Lab+Theory", maxMarks: 16 },
  { code: "ME25C05", type: "Lab", maxMarks: 16 },
  { code: "EC25C03", type: "Lab", maxMarks: 16 }
]
          }
        }
      } 
    }
  },

  //       --- END SEMESTER 1 ---
  //             ============================================================
  //     SEMESTER 2 (NEW — SAMPLE DATA, CHANGE SHEET IDs)
  //     ============================================================

      "2": {

        label: "Semester 3",

        internals: ["IP1", "IP2"],

        rewardSheets: {

          IP1: {
            id: "1eRXlrOLX3MeGb9SvSr4OPp9cEbBHct15Bv8QIkcwKrQ",
            name: "SINCET_2025-2029_All_S3_IP1_RewardSplit"
          },

         // IP2: {
           // id: "PASTE_SEM2_IP2_REWARD_SHEET_ID",
           // name: "Semester2_IP2_Rewards"
         // }

        },


        internalMarksSheets: {

       IP1: {
            "MECH": { id: "1sFa25BZDjcdSg0hlixc1g9Nc-2QAmqFodqmbbLBPax4", name: "MECH" },
            "AIDS": { id: "129zH9nKkd5Veoh4XhzaGENz390AXk1rxPBN_PG3EkNE", name: "AIDS" },
            "CSE": { id: "14kwixr135-I9iqgA1vM4lml-U1Mo9CIKPgnfCNcLKYY", name: "CSE" },
            "ECE": { id: "1mdajVYX0uEyKPbYTdcrrgs3joNFKXKZJ-zAVKtqO8ZE", name: "ECE" },
            "IT": { id: "1vF33LYERn0QlcHnZMpPOE2sEmhv1Z88f-CjCmzPMo1I", name: "IT" },
            "AIML": { id: "1uqX_lVAjrzprCmjAMJ7kbZK1wlwVZzu1U88ZMshgr8I", name: "AIML" }
          }


          /*IP2: {

            "B.Sc CS": {
              id: "PASTE_SEM2_IP2_CS_INTERNAL_SHEET_ID",
              name: "B.Sc CS"
            },

            "B.Sc IT": {
              id: "PASTE_SEM2_IP2_IT_INTERNAL_SHEET_ID",
              name: "B.Sc IT"
            }

          }*/

        },


        subjectConfig: {

          defaultMaxMarks: {
            Theory: 16,
            Lab: 16,
            "Lab + Theory": 16
          },

          departments: {

            "B.Sc CS": [
    { code: "25BCS2CA", type: "Theory", maxMarks: 15 },
    { code: "25BCS2CP", type: "Lab", maxMarks: 15 },
    { code: "25BCS2AA", type: "Theory", maxMarks: 15 },
    { code: "25BCS2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ],

  "B.Sc  CS with AI": [
    { code: "25BAR2CA", type: "Theory", maxMarks: 15 },
    { code: "25BAR2CP", type: "Lab", maxMarks: 15 },
    { code: "25BAR2AA", type: "Theory", maxMarks: 15 },
    { code: "25BAR2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ],

  "B.Sc  AIML": [
    { code: "25BAM2CA", type: "Theory", maxMarks: 15 },
    { code: "25BAM2CP", type: "Lab", maxMarks: 15 },
    { code: "25BAM2AA", type: "Theory", maxMarks: 15 },
    { code: "25BAM2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ],

  "B.Sc DSA": [
    { code: "25BDA2CA", type: "Theory", maxMarks: 15 },
    { code: "25BDA2CP", type: "Lab", maxMarks: 15 },
    { code: "25BDA2AA", type: "Theory", maxMarks: 15 },
    { code: "25BDA2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ],

  "B.Sc DS": [
    { code: "25BDS2CA", type: "Theory", maxMarks: 15 },
    { code: "25BDS2CP", type: "Lab", maxMarks: 15 },
    { code: "25BDS2AA", type: "Theory", maxMarks: 15 },
    { code: "25BDS2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ],

  "B.Sc IT": [
    { code: "25BIT2CA", type: "Theory", maxMarks: 15 },
    { code: "25BIT2CP", type: "Lab", maxMarks: 15 },
    { code: "25BIT2AA", type: "Theory", maxMarks: 15 },
    { code: "25BIT2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
    
  ],
  "B.Sc DCFS": [
    { code: "25BDC2CA", type: "Theory", maxMarks: 15 },
    { code: "25BDC2CP", type: "Lab", maxMarks: 15 },
    { code: "25BDC2AA", type: "Theory", maxMarks: 15 },
    { code: "25BDC2EA", type: "Theory", maxMarks: 15 },
    { code: "25BCS21T", type: "Theory", maxMarks: 15 },
    { code: "25BCS22E", type: "Theory", maxMarks: 15 }
  ]
          }

        }


  // ============================================================================
  //  INSTRUCTIONS FOR ADDING A NEW BATCH
  //  1. Copy the entire block below (starting from { id: 'batch-2024-2027', ... }).
  //  2. Paste it at the top or bottom of the BATCHES array.
  //  3. Update the 'id' (must be unique) and 'label'.
  //  4. Define the 'semesters' relevant for that batch (e.g., Semester 3, 4).
  //  5. Update the Sheet IDs and Subject Configs for that specific batch.
  // ============================================================================

 
          }
];

export const CATEGORY_CODES = ['CD', 'PCDP', 'SM', 'AC', 'RPA', 'SPL', 'OT'];
export const SYSTEM_HEADER_LABELS = ["email address", "name", "register no", "department", "total"];
