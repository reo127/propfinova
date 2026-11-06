# PropFinova CRM - Comprehensive Audit Report

**Date:** April 22, 2026
**Scope:** Full CRM module - Leads, Employees, Assignment, Bulk Upload, Agent Portal

---

## EXECUTIVE SUMMARY

The CRM is a functional system built on **Next.js 16 + MongoDB + Mongoose**. It covers core lead management, employee/agent management, bulk CSV upload, lead assignment with history tracking, status/substatus tracking, and a dedicated agent portal. However, there are **critical security gaps, data integrity risks, and missing features** that would cause serious problems at scale or when handed to a client's team.

**Overall Readiness: Prototype / Internal Beta** - Usable for a small team (2-5 agents) demo, but has significant gaps that will surface as the client scales. The CRM needs hardening before it can be sold as a dependable daily-use tool.

---

## CRM FEATURE MAP (What Exists Today)

### Admin CRM
- **Lead Table** (`src/app/admin/crm/leads/page.jsx`): search, status/date/assignment/agent filters, add lead, bulk upload, bulk assign, CSV/Excel export, cleanup tool, duplicate checker, edit, delete
- **Lead Detail** (`src/app/admin/crm/leads/[id]/page.jsx`): status updates, notes, follow-up/site-visit scheduling & history, property matching, prev/next lead navigation
- **User Management** (`src/app/admin/users/page.jsx`): agent creation, edit, active/inactive toggle, delete, agent lead stats
- **Duplicate Checker** (`src/app/admin/duplicate-checker/page.jsx`): scans duplicate assignments and data inconsistencies
- **Cleanup Tool** (`src/app/admin/cleanup-agent-leads/page.jsx`): unassign all leads from an agent, reassign fresh leads

### Agent Portal
- **Dashboard** (`src/app/agent/dashboard/page.jsx`): assigned/completed/pending counts, success rate, quick links
- **My Leads** (`src/app/agent/my-leads/page.jsx`): agent-specific lead list with filters, call/mail links, pagination
- **Lead Detail** (`src/app/agent/my-leads/[id]/page.jsx`): status/notes update, activity history, property suggestions, next/prev navigation
- **Property Search** (`src/app/agent/property-search/page.jsx`): search properties during calls

### Backend APIs
| Route | Purpose |
|-------|---------|
| `POST/GET /api/leads` | Create lead, list with pagination/filters |
| `PUT /api/leads` | Update status, substatus, add notes |
| `GET/PUT/DELETE /api/leads/[id]` | Single lead CRUD |
| `POST /api/leads/bulk` | CSV bulk upload |
| `POST /api/leads/bulk-assign` | Random bulk assignment |
| `POST /api/leads/assign` | Selected lead assignment |
| `POST /api/leads/unassign-all` | Unassign all from one agent |
| `GET /api/leads/export` | CSV/Excel export |
| `GET/POST /api/agents` | Agent list and creation |
| `GET/PUT/DELETE /api/agents/[id]` | Agent CRUD |
| `GET /api/debug/detect-duplicates` | Scan duplicates |
| `POST /api/debug/remove-duplicates` | Fix duplicates |

---

## WHAT WORKS WELL (Strengths)

1. **Solid Status/Substatus System** - 13 statuses with cascading substatuses well-suited for real estate (not_connected > ringing/switched_off/etc.)
2. **Assignment History Tracking** - Permanent record of which agents worked on which leads, prevents duplicate assignment
3. **Duplicate Prevention in Assignment** - The `$not: $elemMatch` MongoDB pattern correctly prevents reassigning leads to same agent
4. **URL-Based Filter State** - All filters persist in URL, survives page refresh and back-button
5. **Visit & Follow-up History** - Comprehensive scheduling with reschedule tracking
6. **Hover Tooltips on Lead Table** - Quick preview of notes/history/follow-ups without navigating away
7. **CSV/Excel Export with Filters** - Can export filtered lead lists
8. **Visited Lead Tracking** - Green highlight for already-visited leads (session-based)
9. **Template Download** - Helps users format CSV correctly before uploading
10. **Debug/Cleanup Routes** - Practical admin maintenance tools for data consistency
11. **Agent Delete Protection** - Cannot delete agent with currently assigned leads

---

## CRITICAL BUGS & DATA INTEGRITY ISSUES

### 1. DUPLICATE LEAD ON SINGLE CREATE - SILENT SUCCESS
**File:** `src/app/api/leads/route.js:22-28`

When creating a lead with a phone number that already exists, the API returns `success: true` (status 200) with the existing lead's data. The frontend shows no warning. The user thinks they created a new lead, but the system silently discarded their input. If the existing lead has a different name/email/location, that new data is lost.

**Impact:** Agents will add leads thinking they're new. Lost data = lost revenue opportunities. Very confusing for daily users.

---

### 2. CSV PARSER BREAKS ON COMMAS IN DATA
**File:** `src/app/api/leads/bulk/route.js:25`

```javascript
const values = line.split(',').map(v => v.trim());
```

Basic `split(',')` parsing. If any field contains a comma (e.g., name: "Sharma, Rajesh" or location: "Sector 12, Noida"), fields shift - wrong phone numbers, wrong names, validation failures with no clear error message.

**Impact:** Any real-world CSV from a lead vendor will likely have commas in addresses/names. This will silently corrupt data or reject valid rows.

---

### 3. BULK UPLOAD DUPLICATE ROW NUMBERS ARE WRONG
**File:** `src/app/api/leads/bulk/route.js:148-161`

The `duplicatesInCSV` array uses `index + 2` from the valid leads array, not the original CSV rows. If row 3 was invalid and row 5 is a duplicate, it reports as row 4 instead of row 5.

**Impact:** Error reports don't match the actual CSV file. Users can't find and fix the right rows.

---

### 4. IN-FILE CSV DUPLICATES CAN STILL BE INSERTED
**File:** `src/app/api/leads/bulk/route.js:148-171`

Duplicates within the CSV are detected and counted, but the duplicate rows are NOT removed from `validLeads` before filtering against the database. The `newLeads` filter only removes leads already in the DB. If two identical phone rows exist in the CSV and neither is in the DB, both pass to `insertMany`.

**Impact:** Bulk upload can create duplicate leads from the same file.

---

### 5. NO RACE CONDITION PROTECTION ON ASSIGNMENT
**Files:** `src/app/api/leads/bulk-assign/route.js`, `src/app/api/leads/assign/route.js`

The assignment flow is: Query unassigned leads -> Filter -> Update. Between query and update, another admin could assign the same leads. No transactions or optimistic locking during assignment. The lead locking fields (`lockedBy`, `lockedAt`, `lockExpiry`) exist in the schema but are **never used** in any code.

**Impact:** Two admins assigning simultaneously = leads double-assigned, agents waste time, counts become inaccurate.

---

### 6. `insertMany` WITHOUT `ordered: false`
**File:** `src/app/api/leads/bulk/route.js:193`

If ANY lead in the batch fails Mongoose validation not caught by the CSV validator, the ENTIRE batch fails. With `ordered: false`, valid leads would still be inserted.

**Impact:** One bad row can cause hundreds of valid leads to fail.

---

### 7. NO UNIQUE INDEX ON PHONE NUMBER
**File:** `src/models/Lead.js`

Phone has validation (10 digits, required) but no `unique: true` index. All duplicate prevention relies on application-level queries, which are vulnerable to race conditions and concurrent requests.

**Impact:** Database can accumulate duplicate phone entries over time.

---

## SECURITY VULNERABILITIES

### 1. NO SERVER-SIDE API AUTHENTICATION (CRITICAL)
**Every single API route** is unprotected. The auth system exists (`/api/auth/login` generates JWT tokens) but **no route validates these tokens**:

- `POST /api/leads` - Anyone can create leads
- `GET /api/leads` - Anyone can read ALL leads with all personal data
- `DELETE /api/leads/[id]` - Anyone can delete leads
- `POST /api/agents` - Anyone can create admin agents
- `POST /api/leads/assign` - Anyone can reassign leads
- `POST /api/leads/bulk` - Anyone can bulk upload
- `GET /api/agents` - Anyone can list all employees
- `POST /api/debug/remove-duplicates` - Anyone can modify data

**Impact:** Any person with the URL can read all customer data (phone, email, names), delete leads, create fake agents, and manipulate assignments. This is a data protection liability.

### 2. CLIENT-SIDE ONLY AUTH GUARDS
**Files:** `src/app/admin/users/page.jsx:26`, `src/app/admin/crm/leads/page.jsx:93`

Role checking via `localStorage.getItem('user')`. Anyone can set `localStorage.user = '{"role":"admin"}'` in browser console, or call APIs directly via curl/Postman.

### 3. SELF-REGISTRATION AS ADMIN
**File:** `src/app/api/auth/register/route.js`

Registration accepts a submitted `role` field. A user can self-register as `admin` or `agent` if the route is reachable.

### 4. AGENT LEAD OWNERSHIP NOT ENFORCED
The agent detail page fetches `/api/leads/{id}` directly. The API does not check that the lead belongs to the requesting agent. An agent who knows another lead's ID can view or update it.

### 5. INACTIVE AGENTS CAN STILL LOG IN
`isActive` is checked only in bulk assign (filtered in UI). The login API does not check `isActive`, so deactivated agents can still log in and access their leads.

### 6. UNPROTECTED DELETE WITHOUT PROPER CONFIRMATION
**File:** `src/app/admin/crm/leads/page.jsx:453`

No `confirm()` dialog on lead delete. One misclick permanently deletes a lead with all history, notes, and assignment data. No soft-delete, no trash, no recovery.

### 7. REGEX INJECTION IN SEARCH
**File:** `src/app/api/leads/route.js:69-74`

User-provided search string passed directly as regex. Crafted inputs could cause ReDoS or return unintended results.

---

## EMPLOYEE/AGENT MANAGEMENT ISSUES

### Problems Found

1. **No Password Strength Enforcement** - Only `minlength: 6`. No requirements for uppercase, numbers, or special characters. No password reset flow. No email verification.

2. **Deleting Agent Orphans Leads** - When an agent is deleted, assigned leads are orphaned: `assignedTo` still points to deleted ObjectId, `isAssigned` stays `true`, lead becomes invisible in "unassigned" filters and can't be reassigned normally. `populate('assignedTo')` returns `null` showing "Unknown" agent.

3. **No Agent Performance Tracking** - `lastActiveAt` exists but is never updated. `completedLeadsCount` on User model is never incremented anywhere. No login timestamps. No conversion rate tracking.

4. **No Workload Balancing** - Bulk assign picks random leads. No consideration for how many leads an agent already has, their completion rate, or capacity. No round-robin distribution.

5. **Status Audit Trail is Inaccurate** - All status updates and notes are stored with `addedBy: 'admin'` even when an agent makes the update. The API doesn't use the authenticated user identity.

6. **No Team/Hierarchy Support** - All agents are flat. No manager/supervisor role, no teams, no territories.

---

## LEAD MANAGEMENT GAPS

### Status/Substatus Mismatch Between Model and Frontend
The Lead model defines statuses `site_visit_scheduled`, `follow_up_scheduled`, `visit_rescheduled` - but the frontend status color map in `page.jsx` references `follow_up` (without `_scheduled`) and is missing color entries for the scheduled statuses. The `getSubstatusDisplay()` method lists substatuses (`interested_in_revisit`, `plan_cancelled`, `site_visit_scheduled_with_date`) that don't exist in `STATUS_SUBSTATUS_MAP` and can never be selected.

### Other Lead Gaps
- **Only 2 lead sources tracked**: `website` and `bulk_upload`. No Facebook Ads, Google Ads, 99acres, MagicBricks, Housing.com, Walk-in, Referral, etc.
- **No lead scoring/prioritization**: All leads treated equally. No hot/warm/cold classification.
- **No property-lead linking**: Properties and Leads are not connected. Can't tag leads as interested in specific properties.
- **No comprehensive activity log**: Notes exist but no structured timeline of views, calls, emails, property recommendations.
- **Massive code duplication**: Status display maps are copy-pasted across 4+ files (`Lead.js`, leads `page.jsx`, agent `page.jsx`, export `route.js`). Adding a new status requires updating all of them.

---

## BULK UPLOAD ISSUES

| Issue | Detail |
|-------|--------|
| **CSV only** | No Excel upload support (export supports Excel but import doesn't) |
| **No upload history** | No record of who uploaded what, when. Can't roll back a bad batch |
| **5MB limit is low** | May not be enough for 10,000+ row files |
| **No field mapping** | Headers must match exactly (`name`, `phonenumber`, `location`). Real CSVs use "Full Name", "Mobile", "City", etc. |
| **No progress indicator** | Single request for large uploads can timeout |
| **Limited fields** | Can only upload name, phone, location, email. Can't set source, budget, notes, or assign agent in one step |
| **No preview step** | No way to review parsed data before committing |
| **Server doesn't enforce file limits** | 5MB and CSV-only checks are client-side only |

---

## ASSIGNMENT SYSTEM ISSUES

### "Never Reassign to Same Agent" is Too Rigid
**File:** `src/app/api/leads/assign/route.js:44-58`

Permanently prevents reassigning a lead to an agent who ever had it. But in real estate:
- An agent may have left and returned
- A lead may come back after months and should go to the original agent who built rapport
- Admin may need to force-reassign

**No override mechanism exists.**

### Other Assignment Issues
- **No individual lead unassignment from UI** - Only bulk "unassign all" exists. Admin can't take one lead from agent A and give to agent B.
- **Bulk assign count not enforced server-side** - UI has `max="500"` but API accepts unlimited.
- **Agent name stored in history (denormalized)** - If agent name is updated, history retains old name. Should populate from User collection.

---

## AGENT PORTAL ISSUES

| Issue | Detail |
|-------|--------|
| **No call integration** | No click-to-call logging, call recording, or outcome tracking |
| **No notifications** | No reminder for follow-ups, no alert for new lead assignments, no overdue warnings |
| **No mobile optimization** | Agents in the field use phones. UI is desktop-first |
| **No WhatsApp integration** | Critical for India market |
| **Limited agent actions** | Can't mark "call completed", log call duration, or create quick follow-up from list |

---

## MISSING ENTERPRISE CRM FEATURES

| Feature | Status | Priority |
|---------|--------|----------|
| Server-side API auth & RBAC | Missing | **CRITICAL** |
| Database unique phone index | Missing | **CRITICAL** |
| Proper CSV parser | Missing | **CRITICAL** |
| Lead-Property linking | Missing | HIGH |
| Lead source tracking (detailed) | Missing | HIGH |
| Agent performance reports | Missing | HIGH |
| Follow-up/site-visit dashboards | Missing | HIGH |
| Email/SMS integration | Missing | HIGH |
| WhatsApp integration | Missing | HIGH |
| Call logging & tracking | Missing | HIGH |
| Notifications & reminders | Missing | HIGH |
| Reassignment with reason | Missing | HIGH |
| Import preview & error download | Missing | HIGH |
| Lead scoring | Missing | MEDIUM |
| Custom fields per lead | Missing | MEDIUM |
| Pipeline/Kanban view | Missing | MEDIUM |
| Team/territory management | Missing | MEDIUM |
| Full audit log | Partial | MEDIUM |
| Soft delete / trash | Missing | MEDIUM |
| Bulk status update | Missing | MEDIUM |
| Report generation (PDF) | Missing | MEDIUM |
| Calendar integration | Missing | LOW |
| Multi-language support | Missing | LOW |

---

## CODE QUALITY & MAINTAINABILITY

1. **Duplicated logic across 4+ files** - Status maps, substatus maps, color maps all copy-pasted. Should be centralized.
2. **Large monolithic components** - Leads page is 1374 lines, agent leads page is 758 lines. Contains inline modals, table rendering, pagination all in one file.
3. **Zero test files** - No test framework configured. Critical business logic has no automated tests.
4. **Hardcoded values** - Page size (30), bulk assign max (500), file limit (5MB), no admin config panel.
5. **No React error boundaries** - Component crash = white screen.

---

## SUGGESTED TEST PLAN BEFORE DEMO

### Bulk Upload Tests
1. Upload a clean CSV with 10 leads - verify all created
2. Upload same CSV again - verify no duplicates created, proper feedback shown
3. Upload CSV with duplicate phones inside the same file
4. Upload CSV with invalid phones, missing names, missing locations, bad emails
5. Upload names or locations containing commas (e.g., "Sector 12, Noida")
6. Upload a large CSV near the file size limit

### Assignment Tests
1. Create two agents and assign 50 leads to each
2. Unassign all from one agent and assign fresh leads
3. Confirm same lead is not returned to same agent
4. Try two simultaneous bulk assignments and check for overlap
5. Deactivate agent and confirm they're not selectable for new assignment
6. Delete an agent and check what happens to their leads

### Agent Workflow Tests
1. Agent logs in and sees only their assigned leads
2. Agent opens a lead, adds note, changes status, schedules follow-up
3. Agent tries to access another agent's lead URL directly
4. Agent tries to update another agent's lead via direct API call
5. Follow-up and site visit history display correctly

### Admin Workflow Tests
1. Admin searches and filters by status, date, assignment, agent
2. Admin exports filtered leads as CSV and Excel
3. Admin edits and deletes a lead
4. Admin checks duplicate report after known duplicate setup
5. Admin creates agent, assigns leads, deactivates agent, checks lead state

---

## RECOMMENDED IMPLEMENTATION ROADMAP

### Phase 1: Make CRM Safe (Before Any Client Demo)
1. Add server-side JWT auth middleware to ALL API routes
2. Enforce role-based access: admin for admin actions, agent ownership for agent actions
3. Remove public role selection in registration
4. Block login for inactive users
5. Fix the silent duplicate-on-create behavior
6. Add confirmation dialog for lead delete
7. Handle orphaned leads when agent is deleted (auto-unassign)

### Phase 2: Make Data Reliable
8. Add unique index on normalized phone number
9. Replace CSV parser with proper library (papaparse or csv-parse)
10. Fix in-file duplicate detection in bulk upload
11. Add `ordered: false` to `insertMany`
12. Make assignment atomic/transaction-safe
13. Add audit log collection with real user identity
14. Centralize status/substatus maps into shared utility

### Phase 3: Make CRM Client-Ready
15. Add Excel import support
16. Add import preview step and downloadable error report
17. Add individual lead reassignment from UI
18. Add lead source dropdown with proper options
19. Add follow-up/site-visit dashboards
20. Add agent performance reports
21. Add notifications/reminders for follow-ups
22. Add tests for critical CRM flows

### Phase 4: Competitive Features (Post-Launch)
23. Lead scoring system
24. Pipeline/Kanban view
25. WhatsApp/SMS integration
26. Mobile-optimized agent views
27. Property-Lead linking
28. Team/hierarchy management
29. Custom fields per lead
30. Calendar integration

---

## FINAL ASSESSMENT

The CRM has the **right foundation** with good data modeling and thoughtful features like assignment history, status/substatus cascading, and duplicate detection tools. The core architecture (Next.js App Router + MongoDB) is modern and maintainable.

However, the **complete lack of server-side authentication** makes it unsuitable for production use as-is. The CSV parsing bug will cause data corruption with real-world files. Orphaned leads on agent deletion and race conditions on assignment will cause operational problems.

**For a client demo:** Fix Phase 1 items (especially auth, silent duplicate, and delete confirmation).
**For production use:** Fix Phase 1 + Phase 2 items.
**For competitive positioning against industry CRMs:** Add Phase 3 + Phase 4 items.

The codebase is well-organized and the core architecture is sound - it needs hardening and feature completion, not a rewrite.
