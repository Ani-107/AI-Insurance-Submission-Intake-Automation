# Product Requirements Document

## Product

**AI Insurance Submission Intake Automation**

## Problem statement

Commercial-insurance intake teams receive submission details in unstructured broker emails. Staff must manually identify business and coverage information, detect missing data, classify risk type, route the submission, and create a tracking record. The process is repetitive, difficult to measure, and vulnerable to inconsistent routing and lost exceptions.

## Product vision

Create a safe first-pass intake assistant that converts an email into a structured, reviewable record and sends it to the right operational queue, while keeping every underwriting decision with a person.

## Users and stakeholders

| Group | Need |
|---|---|
| Intake analyst | Spend less time copying and sorting submissions |
| Underwriter | Receive complete, relevant, traceable submissions |
| Senior reviewer | See uncertain cases and the reason for escalation |
| Broker | Receive a clear request when required information is missing |
| Operations manager | Measure volume, cycle time, exceptions, and rework |
| Compliance/security | Ensure appropriate access, retention, and AI use |
| Engineering/automation | Maintain explicit rules and observable failure paths |

## Goals

- Convert an eligible broker email into a structured record.
- Detect missing required information consistently.
- Route complete submissions to the appropriate intake team.
- Escalate low-confidence and failed cases for human review.
- Preserve a traceable record of every processed message.
- Reduce repetitive intake effort without automating underwriting decisions.

## Non-goals for the MVP

- Pricing, quoting, binding, declining, or coverage recommendations.
- Automated appetite decisions.
- Parsing attachments such as ACORD forms or loss runs.
- Replacing a policy administration, CRM, or document-management system.
- Claiming production accuracy or time savings before a measured pilot.

## MVP scope

### In scope

- Gmail subject-based trigger
- Email-body normalization
- Structured AI extraction
- Six-category classification
- Confidence score
- Deterministic required-field validation
- Exception and category routing
- Google Sheets append-only log
- Underwriting notification
- Missing-information broker email
- Error fallback to manual review

### Out of scope

- Attachment processing
- Multi-mailbox tenancy
- Real-time appetite/rating integrations
- Production authentication/authorization design
- Automatic retries and dead-letter queue
- Compliance certification

## Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | Process only unread emails matching the configured intake subject. |
| FR-02 | Capture sender, subject, body, received time, and Gmail message ID. |
| FR-03 | Extract the documented insurance fields without inventing missing values. |
| FR-04 | Return only the allowed category values and a confidence score from 0–100. |
| FR-05 | Recompute missing required fields deterministically. |
| FR-06 | Route missing-data cases to Intake Review and generate a focused broker request. |
| FR-07 | Route complete cases below confidence 80 to Senior Intake Review. |
| FR-08 | Route complete cases at confidence 80 or higher by category. |
| FR-09 | Route AI, parsing, and schema errors to Manual Intake Review. |
| FR-10 | Append every outcome to the 20-column Google Sheets log. |
| FR-11 | Notify the responsible internal team with a concise summary and review reason. |
| FR-12 | Keep underwriting decisions outside the automated workflow. |

## User stories and acceptance criteria

### US-01 — Structured intake

**As an intake analyst, I want submission emails converted into structured fields so that I do not re-key routine information.**

Acceptance criteria:

- Given a complete email, when the workflow runs, then all stated fields are captured in the normalized record.
- Information not stated in the source is null.
- The summary is no more than two sentences.
- The record retains the Gmail message ID and received date.

### US-02 — Missing information

**As an intake analyst, I want required fields detected consistently so that incomplete submissions do not enter an underwriting queue as complete.**

Acceptance criteria:

- The five required fields are checked outside the model.
- One or more missing fields sets status to Incomplete.
- The case routes to Intake Review Team.
- Human Review Required is true.
- The broker request names only the missing items.

### US-03 — Low confidence

**As a senior reviewer, I want uncertain submissions escalated so that automation does not hide ambiguity.**

Acceptance criteria:

- Complete submissions with confidence 0–79 route to Senior Intake Review.
- The status is Human Review Required.
- The review reason includes the confidence score.
- A score of exactly 80 proceeds to category routing if no other exception exists.

### US-04 — Category routing

**As an underwriter, I want complete high-confidence submissions assigned to the correct team so that my queue contains relevant work.**

Acceptance criteria:

- Transportation routes to Transportation Underwriting.
- Manufacturing routes to Commercial Underwriting.
- Construction routes to Construction Underwriting.
- Healthcare routes to Healthcare Underwriting.
- Professional Services routes to Professional Lines.
- Other or unknown routes to General Underwriting.

### US-05 — Safe failure

**As an operations manager, I want failed processing attempts visible so that no submission disappears.**

Acceptance criteria:

- An OpenAI, JSON, or schema failure creates a Processing Error outcome.
- The destination is Manual Intake Review.
- Human Review Required is true.
- Source metadata is preserved and the failure is visible for follow-up.

### US-06 — Auditability

**As an operations manager, I want a consistent log so that I can reconcile volume and measure performance.**

Acceptance criteria:

- Every processed outcome maps to the documented 20 columns.
- A new event appends a row rather than overwriting history.
- Status, routing team, human-review flag, reason, and message ID are present.

## Business rules

1. Processing errors take precedence over all other rules.
2. Missing required data takes precedence over confidence and category.
3. Confidence below 80 requires senior human review.
4. Category routing occurs only for complete, successfully parsed records.
5. Unknown categories default to General Underwriting.
6. The automation never approves, declines, prices, quotes, or binds.
7. Public artifacts use only synthetic examples and placeholders.
8. Credentials and live destination identifiers remain outside source control.

## Product decisions and trade-offs

| Decision | Benefit | Risk or trade-off | Follow-up |
|---|---|---|---|
| Email-body-only MVP | Fastest path to learning | Many submissions rely on attachments | Add document parsing after pilot |
| Confidence threshold 80 | Clear operating rule | Model confidence may be poorly calibrated | Evaluate by confidence band |
| Sheets as the log | Transparent and quick | Weak scale, access control, and data quality | Move to governed storage |
| Model + deterministic rules | More robust than model alone | More rule maintenance | Assign business-rule owner |
| Human review for exceptions | Safer rollout | Higher manual workload | Measure and reduce avoidable exceptions |
| General fallback | Prevents dropped categories | Can create rework | Review fallback volume weekly |

## Success measures

The pilot should baseline manual performance first, then measure:

- required-field extraction accuracy;
- first-route accuracy;
- exception capture rate;
- straight-through intake rate;
- human-review rate by reason;
- intake cycle time;
- rework/reassignment rate; and
- later, time-to-quote.

Targets in the main README are hypotheses for pilot planning, not measured results.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated values | Null instruction, source-grounded prompt, deterministic checks, reviewer access to source |
| Prompt injection in email text | Treat the email as data, use strict schema, ignore embedded instructions, validate output |
| Low-confidence misrouting | Threshold escalation and labeled evaluation set |
| Silent workflow failure | Error path, retry/alert backlog, reconciliation by message ID |
| Sensitive-data exposure | Data minimization, private credentials, sanitized public artifacts |
| Automation bias | Clear decision boundary and reviewer training |
| Rule drift | Named business-rule owner and change log |
| Duplicate processing | Add idempotency by Gmail message ID before production |

## Rollout approach

1. **Shadow mode:** process synthetic and historical test emails without operational routing.
2. **Controlled pilot:** one category, named reviewers, daily reconciliation.
3. **Expand categories:** only after UAT and accuracy targets are met.
4. **Operationalize:** monitoring, support runbook, ownership, and change control.
5. **Scale:** attachment parsing, governed storage, and system integrations.

## Definition of done for MVP

- All priority-1 and priority-2 UAT cases pass.
- No open critical or high-severity defects.
- No credentials, personal emails, or live spreadsheet identifiers exist in the repository.
- Operations and underwriting owners approve the routing table and review boundaries.
- A rollback/disable procedure is documented in n8n.
- Pilot KPI definitions and owners are agreed before launch.
