# Architecture and Data Contract

## Purpose

The workflow turns an unstructured broker email into a normalized intake record, applies deterministic business rules, and routes the result to an underwriting intake queue. OpenAI is one component inside a controlled workflow; n8n owns orchestration, validation, routing, audit logging, and notifications.

## Logical architecture

~~~mermaid
sequenceDiagram
    participant B as Broker
    participant G as Gmail
    participant N as n8n
    participant O as OpenAI
    participant S as Google Sheets
    participant U as Underwriting

    B->>G: Send submission email
    G->>N: Trigger on unread matching subject
    N->>N: Normalize message metadata
    N->>O: Send limited email content + JSON schema
    O-->>N: Structured extraction
    N->>N: Parse, validate, and route
    alt Missing required fields
        N->>B: Request missing information
        N->>U: Send to Intake Review
    else Confidence below 80
        N->>U: Send to Senior Intake Review
    else Complete and confidence 80+
        N->>U: Send to category team
    else Processing failure
        N->>U: Send to Manual Intake Review
    end
    N->>S: Append normalized audit row
~~~

## Node responsibilities

| Stage | Responsibility | Key output |
|---|---|---|
| Gmail trigger | Select unread messages matching the intake subject | Raw email and Gmail message ID |
| Prepare submission | Normalize sender, body, subject, and received time | Stable input object |
| OpenAI extraction | Extract fields, classify, summarize, and provide confidence | Strict JSON object |
| Parse and validate | Reject malformed output; recompute missing required fields | Validated submission |
| Completeness decision | Prioritize missing required data | Incomplete or continue |
| Confidence decision | Escalate scores below 80 | Human review or continue |
| Category routing | Map the allowed category to a team | Routing team |
| Finalize record | Set status, review reason, and audit fields | 20-column record |
| Google Sheets | Append one row per processed message | Inspectable intake log |
| Gmail notification | Notify operations/underwriting; follow up with broker | Operational handoff |

## Input contract

The normalized input object should contain:

| Field | Type | Notes |
|---|---|---|
| sender_email | string | Used only for broker follow-up |
| email_subject | string | Intake context |
| email_body | string | Plain-text source for extraction |
| received_date | ISO-8601 string | Preserved from Gmail |
| gmail_message_id | string | Traceability and future idempotency |

## Model output contract

The OpenAI step should return only valid JSON with these fields:

~~~json
{
  "company_name": "string or null",
  "industry": "string or null",
  "business_location": "string or null",
  "annual_revenue": "string or null",
  "employee_count": "number or null",
  "coverage_requested": "string or null",
  "coverage_limit": "string or null",
  "loss_history": "string or null",
  "requested_effective_date": "YYYY-MM-DD or null",
  "submission_category": "Manufacturing | Transportation | Construction | Healthcare | Professional Services | Other",
  "confidence_score": 0,
  "missing_fields": [],
  "submission_summary": "maximum two sentences"
}
~~~

The model is instructed to use null for absent information and never infer facts not present in the email.

## Deterministic validation

The workflow rechecks these fields outside the model:

- company_name
- industry
- business_location
- coverage_requested
- loss_history

Null, undefined, an empty string, and whitespace-only values count as missing. The workflow recomputes missing_fields rather than trusting the model’s list.

Confidence is converted to a number and clamped to 0–100. Unknown categories fall back to Other and General Underwriting.

## Routing precedence

1. Processing or parsing error → Manual Intake Review.
2. Missing required field → Intake Review Team.
3. Complete with confidence below 80 → Senior Intake Review Team.
4. Complete with confidence at least 80 → category team.

This precedence is intentional: a high confidence value cannot bypass missing-data or processing-error rules.

## Category mapping

| Category | Team |
|---|---|
| Transportation | Transportation Underwriting |
| Manufacturing | Commercial Underwriting |
| Construction | Construction Underwriting |
| Healthcare | Healthcare Underwriting |
| Professional Services | Professional Lines |
| Other or unknown | General Underwriting |

## Failure handling

| Failure | Safe behavior |
|---|---|
| OpenAI timeout or node error | Preserve source metadata and create Processing Error record |
| Malformed JSON | Route to Manual Intake Review |
| Missing required field | Log as Incomplete and send a focused broker request |
| Confidence below 80 | Route to Senior Intake Review |
| Unsupported category | Normalize to Other and route to General Underwriting |
| Google Sheets failure | Do not mark the email complete; alert operations and retry |
| Notification failure | Keep the logged record and expose the delivery error for retry |

The screenshot demonstrates the working intake workflow. Production implementation should add retry policies, a dead-letter queue, idempotency, and monitoring.

## Trust boundaries

- Gmail and Sheets OAuth credentials remain inside n8n.
- OpenAI credentials remain inside n8n and are never embedded in code or exports.
- Only the minimum necessary email content should be sent to the model.
- Logs should avoid full raw email bodies when a structured record is sufficient.
- A production deployment needs retention, access-control, encryption, vendor, and regulatory review.

## Production hardening backlog

1. Idempotency keyed by Gmail message ID.
2. Governed database and immutable event history.
3. Attachment scanning and document parsing.
4. Retry/backoff and dead-letter handling.
5. Role-based review queue and correction capture.
6. Prompt/model versioning and evaluation dashboards.
7. Data retention and deletion controls.
8. Operational alerts and service-level objectives.
