# User Acceptance Testing Plan

## Objective

Confirm that the workflow extracts, validates, routes, logs, and notifies as intended, and that every uncertain or failed submission remains visible to a human.

## Test roles

- **Business owner:** confirms required fields and routing rules.
- **Underwriter/reviewer:** validates extracted values and destination.
- **UAT coordinator:** prepares data, records evidence, and tracks defects.
- **Automation owner:** diagnoses workflow and integration failures.

## Test environment

Use a non-production Gmail mailbox, n8n workflow, OpenAI project, and Google Sheet. All test messages must use synthetic data. Do not reuse live broker submissions or production credentials.

## Entry criteria

- Gmail, OpenAI, and Google Sheets test credentials are connected.
- The 20 sheet columns exist in the documented order.
- Test recipients point only to test mailboxes.
- The routing table and required fields have business-owner approval.
- The workflow is disabled for production mail.

## Core test cases

| ID | Scenario | Key input | Expected result | Priority |
|---|---|---|---|---|
| UAT-01 | Complete transportation case | All required fields, confidence 92 | Ready for Underwriting; Transportation Underwriting; one sheet row | P1 |
| UAT-02 | Complete manufacturing case | Category Manufacturing, confidence 90 | Commercial Underwriting | P1 |
| UAT-03 | Complete construction case | Category Construction, confidence 88 | Construction Underwriting | P1 |
| UAT-04 | Complete healthcare case | Category Healthcare, confidence 91 | Healthcare Underwriting | P1 |
| UAT-05 | Complete professional-services case | Category Professional Services, confidence 86 | Professional Lines | P1 |
| UAT-06 | Other category | Complete case, category Other | General Underwriting | P1 |
| UAT-07 | Missing company name | company_name absent | Incomplete; Intake Review; broker request names company name | P1 |
| UAT-08 | Multiple required fields missing | location and loss history absent | Both fields flagged; one focused broker request | P1 |
| UAT-09 | Low confidence | Complete case, confidence 79 | Human Review Required; Senior Intake Review | P1 |
| UAT-10 | Threshold boundary | Complete case, confidence 80 | Category routing, not low-confidence review | P1 |
| UAT-11 | Malformed model JSON | Invalid JSON returned | Processing Error; Manual Intake Review; logged | P1 |
| UAT-12 | OpenAI timeout | Simulated node failure | Processing Error path; source metadata preserved | P1 |
| UAT-13 | Whitespace-only required value | loss_history contains spaces | Field treated as missing | P2 |
| UAT-14 | Unknown category | Complete case, unsupported category | Normalize to Other; General Underwriting | P1 |
| UAT-15 | Missing optional values | Revenue, employee count, and limit absent | Null optional values; routing continues if required fields exist | P2 |
| UAT-16 | Prompt injection in email | Email contains instructions to ignore schema | Instructions ignored; only source facts extracted; strict schema | P1 |
| UAT-17 | Sheet mapping | Known values in all 20 fields | Each value lands in the correct column | P1 |
| UAT-18 | Broker follow-up safety | Incomplete case | Sent only to test sender; no internal details or invented fields | P1 |
| UAT-19 | Internal notification | Successful case | Correct test team receives summary, status, and review reason | P1 |
| UAT-20 | Sheet append failure | Simulated connector error | Email not silently completed; visible error for retry | P1 |

## Detailed evidence for each test

Capture:

1. Test-case ID and input email.
2. n8n execution ID and final node path.
3. Raw model output when permitted in the test environment.
4. Final normalized JSON.
5. Google Sheets row number.
6. Notification evidence.
7. Actual vs. expected result.
8. Pass/fail status and defect ID.

Do not commit screenshots containing live email addresses, tokens, spreadsheet URLs, or real submission data.

## Field-level validation

For the labeled UAT set, compare each extracted value with the source email:

- exact or semantically equivalent company, industry, location, and coverage;
- numerically equivalent revenue, employee count, and limit;
- faithful loss-history text without omitted material facts;
- valid ISO date;
- correct category; and
- no unsupported or invented value.

Track accuracy per field as well as an overall average. An overall number can hide a weak high-risk field.

## Negative and boundary checks

- Null, empty string, and whitespace-only required values are all missing.
- Confidence is clamped to the 0–100 range.
- Confidence 79 escalates; 80 proceeds.
- Model code fences do not break JSON parsing.
- Unknown categories never create an unmapped destination.
- A processing error cannot be reclassified as Ready for Underwriting.
- Missing required data cannot be bypassed by a high confidence score.

## Exit criteria

- 100% of P1 tests pass.
- At least 95% of P2 tests pass, with accepted workarounds documented.
- No open critical or high-severity defects.
- Exception capture is 100% in the controlled test set.
- Required-field and routing accuracy meet the agreed pilot thresholds.
- Business owner signs off on required fields, routing, and broker language.
- Automation owner confirms credentials and identifiers are not present in exported artifacts.

## Defect severity

| Severity | Definition | Example |
|---|---|---|
| Critical | Data exposure, lost submission, or unauthorized underwriting action | Case disappears with no record |
| High | Incorrect routing or exception bypass | Incomplete case marked ready |
| Medium | Workflow completes with recoverable incorrect detail | Optional field mapped incorrectly |
| Low | Cosmetic or wording problem with no decision impact | Notification formatting issue |

Critical and high defects block launch.

## Regression suite

Rerun UAT-01, UAT-07, UAT-09, UAT-10, UAT-11, UAT-14, UAT-16, UAT-17, and UAT-20 whenever the prompt, model, required-field list, routing rules, n8n version, or connector configuration changes.

## Pilot sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| Business owner |  |  |  |
| Underwriting representative |  |  |  |
| Operations representative |  |  |  |
| Automation owner |  |  |  |
| Security/compliance reviewer |  |  |  |
