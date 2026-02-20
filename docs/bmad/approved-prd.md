# Approved PRD

- Cycle ID: 1677f09b-0ff0-42da-8603-670aeb2b082e
- Published at: 2026-02-20T06:17:13.555Z
- BMAD cycle version: 0.1.0
- Goal: Approved: Move to real Selenium/WebDriver-backed runner (production-like MVP)
- Project: Step-shot
- Product: Step-shot
- PRD title: StepShot Selenium Test Runner
- PRD version: 0.1.0

## BMADC Agent Prompt Versions

| Agent | Prompt version |
| --- | --- |
| B | 0.2.10 |
| M | 0.2.0 |
| A | 0.2.0 |
| D | 0.2.0 |
| C | 0.2.0 |

## Peter Prompt Version

- P: Unversioned

## PRD Content

## 1. Understanding
- Restate the product idea or request
  Build a Next.js (TypeScript + Tailwind) StepShot testing app that loads JSON-formatted Selenium command scripts, executes them against a target web app or a locally run Next.js app via Selenium WebDriver, and for each step captures a screenshot, logs status/duration/errors, and generates per-step + final HTML/JSON reports. Provide a clean UI to create/edit/run scripts, view live progress, and download artifacts. This is a revision request that merges these capabilities into the PRD.

- Identify what problem we are solving
  - Reduce friction in authoring, executing, and validating automated UI tests for Next.js applications.
  - Provide an auditable, per-step capture (screenshots, timing, errors) and generate shareable reports.
  - Centralize script management, live monitoring, and artifact downloads in a single web app.

- Identify who we are solving it for
  - QA Engineers and Automation Engineers who author and run Selenium-based tests.
  - Frontend/Full-stack Developers who want quick feedback on UI changes.
  - Release/DevOps engineers who need reproducible test runs and artifacts for audits.

## 2. Clarifying Questions
None.

If any of the following become critical during finalization, we will update PRD accordingly:
- What is the exact JSON schema for Selenium commands (supported actions, waits, assertions, selectors, etc.)?
- Do we require support for multiple browsers (Chrome, Firefox, WebKit) and headless vs headed modes?
- How should authentication/credentials be handled for target apps (embedded secrets management, env vars, vault integration)?
- How will local Next.js apps be prepared for testing (manual URL, port mapping, or automatic local launching)?
- What are the preferred artifact delivery formats and naming conventions for per-step and final reports?
- Should there be CI/CD integration or scheduling capabilities (triggered runs, webhooks, queuing)?
- Are multi-tenant or role-based access controls required, and at what granularity?

## 3. PRD Draft

### 1. Product Overview
- Vision: Create a cohesive StepShot testing platform built with Next.js (TypeScript + Tailwind) that loads JSON-formatted Selenium command scripts, executes them via Selenium WebDriver against target web apps or locally running Next.js apps, captures a screenshot for each step, logs status/duration/errors, and produces per-step and final HTML/JSON reports. Provide a clean UI to create/edit/run scripts, monitor live progress, and download artifacts.
- Objective: Enable end-to-end, repeatable UI testing for Next.js apps with an intuitive editor, real-time run visibility, and readily shareable test artifacts (reports and screenshots).

### 2. Problem Statement
- User Pain Points:
  - Difficulty authoring and maintaining repeatable Selenium tests with predictable outcomes.
  - Lack of per-step visibility (screenshots, timing, errors) during test execution.
  - Friction creating, viewing, and exporting test reports and artifacts.
  - Disconnected tooling for script authoring, execution, and artifact retrieval.
- Business Motivation: Improve test reliability, reduce manual QA effort, accelerate feedback cycles for Next.js applications, and provide auditable test artifacts for releases and compliance.

### 3. Target Users & Personas
- Persona 1
  - Name: Alex the QA Engineer
  - Description: QA automation engineer responsible for UI test coverage of Next.js apps.
  - Characteristics: Familiar with Selenium; prefers a single UI to author/run tests; needs reliable reporting.
  - Goals: Author tests quickly, run them against deployed or local apps, obtain per-step evidence, export reports.
  - Pain Points: Fragmented tooling, hard-to-trace failures, manual steps in reporting.
- Persona 2
  - Name: Priya the Frontend Developer
  - Description: Developer who validates UI changes via automated checks.
  - Characteristics: Comfortable with JSON-like configurations; wants fast feedback.
  - Goals: Integrate automated checks into local dev workflow; understand failures with clear artifacts.
  - Pain Points: Time-consuming test maintenance; unclear failure context.
- Persona 3
  - Name: Lee the Release Engineer
  - Description: Responsible for consistency of test runs in CI/CD and artifact delivery.
  - Characteristics: Focused on reliability, access control, and auditability.
  - Goals: Run scripts reproducibly in controlled environments; access per-run artifacts for reviews.
  - Pain Points: Inconsistent test environments; difficulty obtaining artifacts quickly.

### 4. Goals & Success Metrics
- Business Goals:
  - Increase automated UI test coverage for Next.js apps within defined release cycles.
  - Reduce time to execute and triage UI test runs (lamp down to actionable artifacts quickly).
  - Provide auditable, per-step evidence for compliance and QA traceability.
- User Outcomes:
  - Users can author/edit/run JSON-formatted Selenium scripts in a single UI.
  - Users can monitor live run progress with per-step status, duration, and errors.
  - Users can generate and download per-step and final HTML/JSON reports and artifacts.
- KPIs:
  - Time to author a new script (Target: TBD).
  - Average per-run duration (Target: TBD).
  - Per-step success rate and error rate (Target: TBD).
  - Artifact download frequency per run (Target: TBD).
  - User satisfaction with UI and reporting (Target: TBD).

### 5. Features & Requirements
For each feature, a user story, acceptance criteria, and dependencies are defined.

| Priority | User Story | Acceptance Criteria | Dependencies |
|----------|-----------|---------------------|--------------|
| MUST | As a QA Engineer, I want to create/edit JSON-formatted Selenium scripts in a dedicated editor so that I can author tests reliably. | - Editor validates JSON against the defined schema on save<br>- Editor provides syntax highlighting and basic validation hints<br>- Saving creates or updates a script with versioning support | None |
| MUST | As a user, I want to run a script against a target app (URL or locally running Next.js app) via Selenium WebDriver so that steps execute in sequence. | - Runner connects to target via WebDriver with configured capabilities<br>- Each step executes in order; subsequent steps wait for prior success unless configured otherwise<br>- If a step fails, the run records the error and halts or continues per config | WebDriver environment; target accessible URL or local app setup |
| MUST | As a user, I want per-step screenshots, status, duration, and errors captured and visible during the run. | - Each step captures a screenshot after execution or on failure<br>- Step row shows status (pass/fail/skipped), duration, and error details if any<br>- Live progress pane updates in real-time | Runner UI front-end; backend run progress stream |
| MUST | As a user, I want per-step and final HTML/JSON reports with artifacts (screenshots, logs) downloadable after a run. | - Reports include per-step data: actions, selectors, duration, status, and errors<br>- Screenshots and logs are included as downloadable artifacts<br>- HTML and JSON report formats are available for both per-step and final results | Report generation service; artifact storage |
| MUST | As a user, I want a clean UI to manage scripts (CRUD), with search, filters, and versioning. | - Create, edit, delete, duplicate scripts; search and filter by name, status, tags<br>- Version history and rollback options<br>- Import/Export of scripts | Script storage backend |
| SHOULD | As a user, I want to run scripts against both external web apps and locally running Next.js apps via configurable targets. | - Configuration supports target URL or local app flag and local port if required<br>- Runner uses appropriate WebDriver configuration for the target | WebDriver environment; local app readiness |
| SHOULD | As an admin, I want basic user management and access control for script runs and artifacts. | - Roles (e.g., Admin, Editor, Viewer) enforced in UI<br>- Run access and artifact access controlled per user | Authentication/Authorization layer |
| NICE-TO-HAVE | As a user, I want scheduling and/or queueing of runs in CI-like fashion and API access for automation. | - Queue or schedule runs; API endpoints to start runs and fetch results | API surface; job queue system |

### 6. Constraints & Assumptions

| Type | Category | Description | Risk |
|------|----------|-------------|------|
| Constraint | Technical | Tech stack includes Next.js (TypeScript + Tailwind) with a WebDriver-based executor; supports JSON-formatted Selenium commands | Dependency on stable WebDriver capabilities and browser drivers; cross-browser considerations |
| Constraint | Operational | Runs may target external apps or locally running Next.js apps; environments must provide accessible endpoints or local app readiness | Potential network/firewall issues; local environment setup complexity |
| Constraint | Security | Tests may include credentials or secrets; need secure handling, storage, and access control | Secret leakage risk if not properly managed |
| Assumption | Business | Script repository supports multi-user collaboration with versioning | Data consistency and merge conflicts to be managed |
| Assumption | Data | JSON command scripts conform to a defined schema and can be extended in the future | Schema drift risk; need deprecation plan |

### 7. Out of Scope
- Deep integration with non-Selenium-based test tooling (e.g., Cypress) unless converted to the StepShot JSON schema.
- Non-UI functional tests not expressible via Selenium commands.
- Native desktop app testing (focus is on web apps and Next.js web UIs).
- Advanced AI-assisted test generation or self-healing test capabilities (initial MVP focuses on explicit scripts).
- End-to-end CI pipeline orchestration beyond exposing run APIs and artifacts.

### 8. Open Questions
- [HIGH] What is the exact, published JSON schema for Selenium commands? Which actions and waits must be supported, and how are selectors expressed (CSS, XPath, etc.)?
- [HIGH] How many browsers and run modes are required (e.g., Chrome/Chromium, Firefox; headless vs headed)?
- [MEDIUM] How should credentials be handled in tests (embedded vs linked to a secrets manager, scope, rotation policies)?
- [MEDIUM] How will local Next.js apps be prepared for testing (auto-launch, port mapping, or manual URL entry)?
- [LOW] Are there any CI/CD integrations or webhook capabilities required for run events?
- [LOW] What reporting customization or branding requirements exist for HTML/JSON reports (logo, theme, metadata)?

### 9. Version & Approval History
The table is system-managed from authoritative `prd_versions` records. Do not manually write or append table rows in PRD content.

### 10. Version Impact
- Recommended bump: minor
- Rationale: The revision adds substantial new capabilities (JSON-script-driven Selenium execution with per-step reporting, live progress, and artifact download) that expand the product scope beyond the prior draft, but do not redefine core product category.

## 4. Next Steps
- [ ] Review PRD with stakeholders
- [ ] Resolve open questions
- [ ] Obtain approval
- [ ] Hand off to Builder Ben for BMAD cycle