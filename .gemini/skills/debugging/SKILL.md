---
name: Fullstack Debugging
description: Use this skill to debug backend issues via logs and frontend issues by instructing the user to check the browser console.
---

# Fullstack Debugging Guide

When dealing with a bug or an unspecified application error, follow this standard procedure to narrow down the issue across both backend and frontend systems.

## 1. Backend Investigation
- **Check the Logs:** Proceed immediately to check the backend logs.
- Use the Schema0 CLI (e.g., `bun schema0 logs`) to fetch or monitor the recent logs from the backend server. Look for stacktraces, HTTP 500 errors, or failed database queries.

## 2. Frontend Investigation
- **Ask the User for Console Output:** Since you do not typically have access to the user's local browser context, you must ask the user for help.
- Inform the user to press **F12** (or right-click -> Inspect) to open the browser Developer Tools.
- Ask the user to review the **Console** tab for any JavaScript errors.
- Ask the user to review the **Network** tab to see if any API requests from the frontend are failing (e.g., returning 400 or 500 status codes) and to share the response payloads of those failed requests.

## 3. Resolution
- Once you process both the backend logs and the frontend errors shared by the user, correlate the timing and data to identify the true root cause.
