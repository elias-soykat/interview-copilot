# Job Description & Resume Context in Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide flexible Job Description and validated Resume JSON input fields in Settings, persist them, and inject both into the AI prompt so interview answers are tailored to job requirements while remaining strictly truthful to the candidate's resume.

**Architecture:**

1. Renderer: Enhance `SettingsModal.tsx` with a flexible Job Description textarea and a validated, formatted JSON Resume editor with error indicators and reset/format actions.
2. Bridge/Preload: Synchronize `preload/index.ts` AppSettings interface with `preload/index.d.ts` including `jobDescription`.
3. Backend/IPC: Ensure `handlers.ts` dynamically updates running `OpenAIService` configurations on `update-settings` without requiring app restarts, persisting through `SettingsManager`.
4. Prompt Engine: Upgrade `openaiService.ts` system prompt to systematically incorporate target job requirements and candidate resume JSON with strict truthfulness constraints (no hallucinated skills or unearned achievements).

**Tech Stack:** TypeScript, React, Tailwind CSS, Lucide icons, Electron IPC, OpenAI API.

**Spec:** User request specifying flexible Job Description, validated/formattable Resume JSON with save prevention on syntax errors, dual-context prompt alignment with strict truthfulness, and reliable persistence.

## Global Constraints

- Job Description must remain flexible without enforcing any rigid schema.
- Resume Description must be valid JSON; invalid JSON must be blocked from saving.
- Answers must be tailored to the job requirements while remaining strictly truthful to the resume (no invented skills or achievements).
- Settings must persist reliably across application restarts.
- Zero typecheck errors across node and web targets (`npm run typecheck`).

## Review Focus

1. User enters invalid JSON in the resume editor -> UI shows clear syntax error details and disables Save button.
2. User clicks "Prettify JSON" on valid JSON -> JSON is nicely indented (2 spaces) without loss of data.
3. User pastes raw unformatted job description -> Correctly saved, persisted, and passed to AI prompt without formatting restrictions.
4. User updates settings during an active interview session -> `OpenAIService` receives updated config immediately via IPC.
5. Interview question asked -> Generated answer uses target role context from Job Description and personal experience from Resume JSON without hallucinating unlisted qualifications.

---

### Task 1: Synchronize Interfaces and Type Definitions

**Files:**

- Modify: `src/preload/index.ts:23-32`
- Test: `npm run typecheck`

**Interfaces:**

- Produces: `AppSettings` with `jobDescription: string` in `src/preload/index.ts`

- [ ] **Step 1: Update AppSettings in `src/preload/index.ts`**
      Add `jobDescription: string` to `AppSettings` in `src/preload/index.ts` so renderer and main agree on the full settings contract.

- [ ] **Step 2: Run typecheck to verify interface alignment**
      Run: `npm run typecheck`
      Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: add jobDescription to preload AppSettings interface"
```

---

### Task 2: Update System Prompt Engine with Dual-Context & Strict Truthfulness

**Files:**

- Modify: `src/main/services/openaiService.ts`
- Create / Update: `tests/systemPrompt.test.ts` (or verification script)

**Interfaces:**

- Consumes: `resumeDescription?: string`, `jobDescription?: string`
- Produces: Updated `getSystemPrompt(resumeDescription?: string, jobDescription?: string): string` and reactive `updateConfig(config: Partial<OpenAIConfig>): void`

- [ ] **Step 1: Write verification test for prompt generation**
      Verify that `getSystemPrompt` properly embeds:

1. Target job description under role requirements context.
2. Candidate resume JSON under candidate background context.
3. Explicit behavioral rules: tailor to JD, strictly truthful to resume, never invent qualifications.

- [ ] **Step 2: Update `getSystemPrompt` and `OpenAIService` in `src/main/services/openaiService.ts`**
- Update `getSystemPrompt` signature: `getSystemPrompt(resumeDescription: string, jobDescription?: string): string`.
- Inject structured `TARGET JOB DESCRIPTION & REQUIREMENTS` section when `jobDescription` is non-empty.
- Inject structured `CANDIDATE BACKGROUND & RESUME (JSON FORMAT)` section when `resumeDescription` is non-empty.
- Add strict directives:
  - "ALIGNMENT WITH JOB REQUIREMENTS: Frame responses to address the technical level, responsibilities, and qualifications of the target job."
  - "STRICT TRUTHFULNESS & GROUNDING: Speak in first person. Base all personal anecdotes, technical skills, projects, and achievements strictly on the provided resume JSON. NEVER invent unlisted skills, projects, employment history, or metrics."
  - "SKILL GAPS: If asked about a skill or technology not present in the resume, speak to related foundational concepts honestly without falsely claiming hands-on production experience."
- In `OpenAIService.constructor` and `updateConfig`, pass both `config.resumeDescription` and `config.jobDescription` to `getSystemPrompt`.

- [ ] **Step 3: Run typecheck and verification script**
      Run: `npm run typecheck`
      Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/main/services/openaiService.ts
git commit -m "feat: enhance AI prompt with flexible job description and truthful resume JSON context"
```

---

### Task 3: Enable Dynamic Settings Propagation in IPC Handlers

**Files:**

- Modify: `src/main/ipc/handlers.ts:32-45`
- Test: `npm run typecheck`

**Interfaces:**

- Consumes: `ipcMain.handle('update-settings')`
- Produces: Dynamic update to active `openaiService.updateConfig()`

- [ ] **Step 1: Update `handlers.ts` to push settings updates to active `openaiService`**
      In `ipcMain.handle('update-settings')`, ensure that if `openaiService` is currently instantiated, `openaiService.updateConfig(...)` is called with updated API key, model, `resumeDescription`, and `jobDescription`.

- [ ] **Step 2: Run typecheck to verify**
      Run: `npm run typecheck`
      Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc/handlers.ts
git commit -m "feat: update active openaiService config dynamically on settings update"
```

---

### Task 4: Implement Settings UI with Job Description & Validated Resume JSON Editor

**Files:**

- Modify: `src/renderer/src/components/SettingsModal.tsx`
- Create / Update: `src/renderer/src/constants/defaultJobDescription.ts` (optional sample template)

**Interfaces:**

- Consumes: `AppSettings` (`jobDescription`, `resumeDescription`), `window.api.updateSettings`
- Produces: UI with:
  1. Flexible Job Description textarea with clear instructions and optional "Insert Sample Template" helper.
  2. Monospace Resume JSON editor with live syntax validation badge, "Prettify JSON" formatter, "Reset to Default" button, and disabled Save button when JSON is invalid.

- [ ] **Step 1: Add default job description template constant**
      In `src/renderer/src/constants/defaultJobDescription.ts`, define a clean markdown template for users who want a structured starting point (while allowing any arbitrary text).

- [ ] **Step 2: Update `SettingsModal.tsx` with dual input fields & JSON validation**
- Add state for `jsonError: string | null` derived or checked on `localSettings.resumeDescription`.
- Validate JSON whenever `resumeDescription` changes:
  ```typescript
  let isValidJson = true
  let jsonErrorMessage = ''
  try {
    JSON.parse(localSettings.resumeDescription)
  } catch (err) {
    isValidJson = false
    jsonErrorMessage = (err as Error).message
  }
  ```
- Implement "Prettify JSON" action that parses and re-formats valid JSON with 2 spaces indentation.
- Implement "Reset to Default" action that resets to `DEFAULT_RESUME_DESCRIPTION`.
- Render **Job Description / Role Description**:
  - Flexible textarea (rows 6), accepts any pasted text or structured template.
  - Helper text explaining it is used to tailor answers to the role requirements.
  - Quick button: "Insert Sample Template" (only if empty or user requests).
- Render **Resume Description (JSON)**:
  - Monospace textarea (rows 8, `font-mono text-xs`).
  - Live status indicator: Green badge `Valid JSON` or Red alert `Invalid JSON: [error]`.
  - Top action buttons: "Prettify JSON" and "Reset to Default".
- Prevent saving if JSON is invalid:
  - Disable the "Save" button when `!isValidJson`.
  - Show error tooltip / message next to save button if clicked or attempted.

- [ ] **Step 3: Run typecheck & build to verify web bundle**
      Run: `npm run typecheck`
      Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/constants/defaultJobDescription.ts src/renderer/src/components/SettingsModal.tsx
git commit -m "feat: add flexible job description input and validated JSON resume editor to Settings"
```

---

### Task 5: End-to-End Verification and Testing

**Files:**

- Test scripts / execution verification
- Verify persistence, JSON validation, and prompt integration

- [ ] **Step 1: Run complete typecheck and linting**
      Run: `npm run typecheck && npm run lint`
      Expected: Zero errors.

- [ ] **Step 2: Test JSON formatting and validation edge cases**
      Verify:

1. Valid JSON passes parsing and formatting.
2. Malformed JSON triggers syntax error and blocks save.
3. Empty/flexible job description handles arbitrary text and empty states gracefully.
4. Settings persist across save and reload cycles.

- [ ] **Step 3: Verification commit**

```bash
git status
```
