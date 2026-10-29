# Security and Privacy

This repository is a demonstration prototype and must contain only synthetic or sanitized data.

## Do not commit

- API keys, OAuth tokens, passwords, or session cookies
- n8n credential IDs or exported credential objects
- Personal email addresses
- Live Gmail message IDs
- Live Google spreadsheet IDs or URLs
- Real broker, insured, claim, loss-run, or policy data
- Raw production workflow exports without manual review

Use placeholders such as **UNDERWRITING_TEAM_EMAIL**, **YOUR_SHEET_ID**, and **YOUR_N8N_CREDENTIAL**.

## Public screenshots

Before committing a screenshot:

1. Check browser bars, account avatars, URLs, sheet IDs, and email addresses.
2. Replace visible personal values with synthetic examples.
3. Inspect the final rendered image at full resolution.
4. Confirm the file does not include unnecessary metadata.

The Google Sheets image in this repository uses a synthetic sender address.

## Production considerations

A real deployment requires, at minimum:

- vendor and data-processing review;
- least-privilege credentials and role-based access;
- encryption in transit and at rest;
- retention and deletion policies;
- audit logging and incident response;
- prompt/model version controls and evaluation;
- approved handling of regulated and sensitive insurance data; and
- documented human responsibility for underwriting decisions.

## Reporting

If you discover a secret or personal data in the repository, remove access to the affected credential or artifact first, rotate the credential if applicable, and then clean the repository history before making it public again.
