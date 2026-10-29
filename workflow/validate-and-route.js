/**
 * n8n Code node: deterministic validation and routing
 *
 * Expected input:
 * - normalized Gmail metadata on the current item
 * - model JSON in ai_response, output, text, message.content,
 *   choices[0].message.content, extracted, or already merged on the item
 *
 * This code does not make an underwriting decision. It prepares an intake route.
 */

const source = $input.first().json;

const requiredFields = [
  'company_name',
  'industry',
  'business_location',
  'coverage_requested',
  'loss_history',
];

const categoryLookup = {
  manufacturing: 'Manufacturing',
  transportation: 'Transportation',
  construction: 'Construction',
  healthcare: 'Healthcare',
  'professional services': 'Professional Services',
  other: 'Other',
};

const teamByCategory = {
  Manufacturing: 'Commercial Underwriting',
  Transportation: 'Transportation Underwriting',
  Construction: 'Construction Underwriting',
  Healthcare: 'Healthcare Underwriting',
  'Professional Services': 'Professional Lines',
  Other: 'General Underwriting',
};

function hasValue(value) {
  return value !== null
    && value !== undefined
    && !(typeof value === 'string' && value.trim() === '');
}

function stripCodeFence(value) {
  const fence = String.fromCharCode(96).repeat(3);
  let result = value.trim();

  if (result.toLowerCase().startsWith(fence + 'json')) {
    result = result.slice(7).trim();
  } else if (result.startsWith(fence)) {
    result = result.slice(3).trim();
  }

  if (result.endsWith(fence)) {
    result = result.slice(0, -3).trim();
  }

  return result;
}

function parseModelOutput(input) {
  const candidates = [
    input.extracted,
    input.ai_response,
    input.output,
    input.text,
    input.message?.content,
    input.choices?.[0]?.message?.content,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate;
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      return JSON.parse(stripCodeFence(candidate));
    }
  }

  if (requiredFields.some((field) => Object.prototype.hasOwnProperty.call(input, field))) {
    return input;
  }

  throw new Error('No supported model-output field was found.');
}

try {
  const extracted = parseModelOutput(source);

  const rawConfidence = Number(extracted.confidence_score);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.min(100, Math.max(0, rawConfidence))
    : 0;

  const rawCategory = String(extracted.submission_category ?? 'Other')
    .trim()
    .toLowerCase();
  const category = categoryLookup[rawCategory] ?? 'Other';

  const missingFields = requiredFields.filter(
    (field) => !hasValue(extracted[field]),
  );

  let submissionStatus;
  let routingTeam;
  let humanReviewRequired;
  let reviewReason;

  if (missingFields.length > 0) {
    submissionStatus = 'Incomplete';
    routingTeam = 'Intake Review Team';
    humanReviewRequired = true;
    reviewReason = 'Missing required fields: ' + missingFields.join(', ');
  } else if (confidence < 80) {
    submissionStatus = 'Human Review Required';
    routingTeam = 'Senior Intake Review Team';
    humanReviewRequired = true;
    reviewReason = Number.isFinite(rawConfidence)
      ? 'Confidence score ' + confidence + ' is below the threshold of 80.'
      : 'Confidence score was unavailable or invalid.';
  } else {
    submissionStatus = 'Ready for Underwriting';
    routingTeam = teamByCategory[category];
    humanReviewRequired = false;
    reviewReason = 'Complete submission; confidence score ' + confidence + '.';
  }

  return [{
    json: {
      ...source,
      ...extracted,
      submission_category: category,
      confidence_score: confidence,
      missing_fields: missingFields,
      submission_status: submissionStatus,
      routing_team: routingTeam,
      human_review_required: humanReviewRequired,
      review_reason: reviewReason,
      processed_at: new Date().toISOString(),
    },
  }];
} catch (error) {
  return [{
    json: {
      ...source,
      submission_category: 'Other',
      confidence_score: 0,
      missing_fields: requiredFields,
      submission_status: 'Processing Error',
      routing_team: 'Manual Intake Review',
      human_review_required: true,
      review_reason: 'AI response could not be parsed or validated.',
      processing_error: error.message,
      processed_at: new Date().toISOString(),
    },
  }];
}
