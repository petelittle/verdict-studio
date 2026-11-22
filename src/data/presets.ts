import type { DecisionPreset } from '../shared/decisionTypes';

export const SAMPLE_ASSETS = [
  {
    id: 'headphones',
    name: 'Returned Headphones (Cracked Hinge)',
    assetPath: '/src/assets/images/sample_damaged_headphones_1795367398154.jpg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'package',
    name: 'Porch Delivery (Crushed Corner)',
    assetPath: '/src/assets/images/sample_package_delivery_1795367397587.jpg',
    mimeType: 'image/jpeg',
  },
] as const;

export const DECISION_PRESETS: DecisionPreset[] = [
  {
    id: 'returns-triage',
    name: 'Returns & Churn Triage',
    category: 'Customer Operations',
    summary:
      'Evaluate a customer order JSON payload and message across a binary defect gate, resolution router, and churn-risk rubric in a single call.',
    inputBlocks: [
      {
        id: 'rt-order',
        type: 'text',
        label: 'Order Context (JSON)',
        isJson: true,
        content: JSON.stringify(
          {
            order: { id: 'ORD-8821', item: 'Studio Wireless Headphones', price_usd: 240 },
            customer_tier: 'Gold',
            days_since_delivery: 4,
          },
          null,
          2,
        ),
      },
      {
        id: 'rt-msg',
        type: 'text',
        label: 'Customer Message',
        isJson: false,
        content:
          'Audio cuts out intermittently on the left earcup whenever I turn my head, and the hinge looks cracked out of the box. Fix this today or I am canceling my membership and switching brands.',
      },
    ],
    questions: [
      {
        id: 'rt-q1',
        key: 'is_hardware_defect',
        type: 'noul',
        instructions: 'Does the customer message describe a physical or functional hardware defect?',
        trueDescription: 'Broken, cracked, faulty audio, or malfunctioning component.',
        falseDescription: 'Buyer remorse, color/size preference, shipping delay, or pricing question.',
        threshold: 0.75,
      },
      {
        id: 'rt-q2',
        key: 'next_action',
        type: 'choice',
        instructions:
          'Select the best resolution action given the customer tier, item value, and reported issue.',
        options: [
          {
            id: 'opt-1',
            key: 'instant_refund',
            description: 'Refund without return. Low item value or indisputable fault on arrival.',
          },
          {
            id: 'opt-2',
            key: 'replacement_shipment',
            description: 'Ship replacement immediately; customer returns original damaged unit.',
          },
          {
            id: 'opt-3',
            key: 'troubleshooting_flow',
            description: 'Issue is likely software pairing or user configuration fixable via guide.',
          },
          {
            id: 'opt-4',
            key: 'human_escalation',
            description: 'Ambiguous claim, policy edge case, or safety hazard requiring manual review.',
          },
        ],
        confidenceThreshold: 0.6,
      },
      {
        id: 'rt-q3',
        key: 'churn_risk',
        type: 'score',
        instructions: 'How likely is the customer to churn if the issue is not resolved today?',
        levels: [
          'No churn signal: neutral or patient tone.',
          'Mild frustration: expresses disappointment without leaving.',
          'Mentions alternatives: compares competitors or threatens return.',
          'Explicit cancellation threat: states intent to cancel account or switch immediately.',
        ],
      },
    ],
  },
  {
    id: 'multimodal-damage',
    name: 'Multimodal Hardware Inspection',
    category: 'Visual Quality Audit',
    summary:
      'Inspect a customer return photograph alongside ticket notes to verify physical breakage, warranty eligibility, and condition severity.',
    inputBlocks: [
      {
        id: 'mh-note',
        type: 'text',
        label: 'Inspector Intake Note',
        isJson: false,
        content:
          'Customer claims the wireless headphones arrived with structural hinge damage. Inspect the uploaded return photo carefully, ignoring the wooden table background.',
      },
      {
        id: 'mh-img',
        type: 'image',
        name: 'sample_damaged_headphones.jpg',
        mimeType: 'image/jpeg',
        previewUrl: '/src/assets/images/sample_damaged_headphones_1795367398154.jpg',
        assetPath: '/src/assets/images/sample_damaged_headphones_1795367398154.jpg',
        resolution: 'medium',
      },
    ],
    questions: [
      {
        id: 'mh-q1',
        key: 'visible_structural_damage',
        type: 'noul',
        instructions:
          'Does the photograph show visible physical cracks, fractures, or structural breakage on the headphones?',
        trueDescription: 'Clear crack, split plastic, detached hinge, or bent frame on the device.',
        falseDescription: 'Intact housing with only minor dust, lighting reflections, or normal wear.',
        threshold: 0.7,
      },
      {
        id: 'mh-q2',
        key: 'intake_disposition',
        type: 'choice',
        instructions: 'Which warehouse disposition should this returned item receive?',
        options: [
          {
            id: 'mh-o1',
            key: 'restock_open_box',
            description: 'Intact, clean, and resalable as open-box inventory.',
          },
          {
            id: 'mh-o2',
            key: 'refurbish_repair',
            description: 'Repairable cosmetic or single-component mechanical fault.',
          },
          {
            id: 'mh-o3',
            key: 'salvage_scrap',
            description: 'Severe structural fracture; unsafe or uneconomical to repair.',
          },
          {
            id: 'mh-o4',
            key: 'manual_audit',
            description: 'Photo is blurry, obscured, or inconclusive.',
          },
        ],
        confidenceThreshold: 0.65,
      },
      {
        id: 'mh-q3',
        key: 'cosmetic_condition_damage',
        type: 'score',
        instructions: 'Rate the visible physical damage severity on the product.',
        levels: [
          'Pristine: no visible marks or damage.',
          'Light wear: minor surface scuffs only.',
          'Moderate damage: deep scratches or small housing crack.',
          'Severe damage: major structural fracture or broken hinge assembly.',
        ],
      },
    ],
  },
  {
    id: 'delivery-audit',
    name: 'Porch Delivery Proof Audit',
    category: 'Logistics & Fulfillment',
    summary:
      'Audit carrier drop-off photography against parcel metadata to catch transit crush damage and porch placement issues automatically.',
    inputBlocks: [
      {
        id: 'da-meta',
        type: 'text',
        label: 'Shipment Manifest (JSON)',
        isJson: true,
        content: JSON.stringify(
          {
            tracking_id: 'TRK-994021',
            contents: 'Ceramic Espresso Set (Fragile)',
            declared_value_usd: 165,
            weather_alert: 'Light rain expected',
          },
          null,
          2,
        ),
      },
      {
        id: 'da-img',
        type: 'image',
        name: 'sample_package_delivery.jpg',
        mimeType: 'image/jpeg',
        previewUrl: '/src/assets/images/sample_package_delivery_1795367397587.jpg',
        assetPath: '/src/assets/images/sample_package_delivery_1795367397587.jpg',
        resolution: 'medium',
      },
    ],
    questions: [
      {
        id: 'da-q1',
        key: 'box_crush_visible',
        type: 'noul',
        instructions:
          'Does the cardboard shipping box show visible corner crushing, buckling, or structural deformation?',
        trueDescription: 'Dented corners, collapsed sidewalls, or torn corrugated cardboard.',
        falseDescription: 'Crisp, intact rectangular carton with no visible crushing.',
        threshold: 0.7,
      },
      {
        id: 'da-q2',
        key: 'claim_readiness',
        type: 'choice',
        instructions: 'How should the logistics team classify this delivery proof photo?',
        options: [
          {
            id: 'da-o1',
            key: 'clean_delivery',
            description: 'Package intact and sheltered properly.',
          },
          {
            id: 'da-o2',
            key: 'proactive_damage_flag',
            description: 'Visible transit crush on fragile shipment; flag for proactive outreach.',
          },
          {
            id: 'da-o3',
            key: 'weather_exposure_risk',
            description: 'Box intact but left uncovered in exposed weather.',
          },
          {
            id: 'da-o4',
            key: 'unusable_photo',
            description: 'Box not visible or image too dark to assess.',
          },
        ],
        confidenceThreshold: 0.6,
      },
      {
        id: 'da-q3',
        key: 'parcel_integrity_risk',
        type: 'score',
        instructions: 'Rate the risk that fragile contents inside were impacted based on outer box condition.',
        levels: [
          'Negligible risk: outer carton intact.',
          'Low risk: minor surface crease only.',
          'Moderate risk: noticeable corner dent or compression.',
          'High risk: severe structural crush or torn seam.',
        ],
      },
    ],
  },
  {
    id: 'incident-routing',
    name: 'Production Incident Triage',
    category: 'Engineering Operations',
    summary:
      'Classify incoming bug reports and stack traces for data-loss risk, owning engineering team, and incident severity.',
    inputBlocks: [
      {
        id: 'ir-report',
        type: 'text',
        label: 'Bug Report & Trace',
        isJson: false,
        content:
          'After deploying v2.14.3 to EU-West, CSV invoice exports fail with HTTP 500 in Safari 18 when currency symbols are non-ASCII (e.g. ¥ or €). Chrome and Firefox exports still succeed cleanly. No database rows are modified during export.',
      },
    ],
    questions: [
      {
        id: 'ir-q1',
        key: 'data_corruption_risk',
        type: 'noul',
        instructions: 'Does this report indicate potential data loss, corruption, or unauthorized access?',
        trueDescription: 'Writes failing mid-transaction, deleted records, or leaked tenant data.',
        falseDescription: 'Read-only UI/export failure or client rendering bug with intact stored data.',
        threshold: 0.65,
      },
      {
        id: 'ir-q2',
        key: 'owning_team',
        type: 'choice',
        instructions: 'Which engineering team should own the investigation?',
        options: [
          {
            id: 'ir-o1',
            key: 'billing_exports',
            description: 'Invoice formatting, CSV/PDF export serialization, and currency encoding.',
          },
          {
            id: 'ir-o2',
            key: 'auth_security',
            description: 'Login, permissions, SSO, and token validation.',
          },
          {
            id: 'ir-o3',
            key: 'infra_database',
            description: 'Database migrations, cluster availability, and regional failover.',
          },
          {
            id: 'ir-o4',
            key: 'other',
            description: 'Issues outside billing, auth, or core infrastructure.',
          },
        ],
        confidenceThreshold: 0.7,
      },
      {
        id: 'ir-q3',
        key: 'issue_severity',
        type: 'score',
        instructions: 'How severe is this issue for affected users?',
        levels: [
          'Cosmetic: visual glitch only, no lost functionality.',
          'Workaround available: a workflow fails in one browser or path, but another way works.',
          'Major degradation: core workflow fails for a cohort with no easy workaround.',
          'Total outage: service down or data loss across all users.',
        ],
      },
    ],
  },
  {
    id: 'custom-blank',
    name: 'Custom Blank Evaluator',
    category: 'Scratchpad',
    summary:
      'Author your own shared multimodal input and mixed-type decision questions from a clean slate.',
    inputBlocks: [
      {
        id: 'cb-text',
        type: 'text',
        label: 'Primary Input Text',
        isJson: false,
        content: '',
      },
    ],
    questions: [
      {
        id: 'cb-q1',
        key: 'policy_compliant',
        type: 'noul',
        instructions: 'Does the input satisfy your evaluation policy?',
        trueDescription: 'Meets all policy requirements.',
        falseDescription: 'Violates one or more policy rules.',
        threshold: 0.7,
      },
    ],
  },
];
