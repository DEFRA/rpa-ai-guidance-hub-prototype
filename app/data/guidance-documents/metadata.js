//
// Facts about every guidance document — title/description/version tag, the
// last updated/published dates, and the category/scheme/year/versions detail
// below — with no prose content: a document's real step-by-step content
// (where it has any) lives as its own .md file in ./content/, loaded by
// app/lib/guidance-content-loader.js and merged back on in ./index.js. Kept
// separate so this file stays skimmable as pure data, and so the shape here
// already matches the real API's own split between document metadata and
// per-version Markdown content (see docs/guidance-document-storage.md).
//
// versions (the guide/document-overview pages' Version dropdown) is
// additional detail alongside, not instead of, the top-level
// version/lastUpdated/published fields above — those three keep driving the
// version tag shown in the hub and guide pages. Whichever of
// versions.version1/version2 matches the top-level version repeats the same
// lastUpdated/published values; the other is invented placeholder detail for
// a version that either came before it or has not been published yet, always
// dated earlier/later accordingly so the two stay in a sensible order.
//
// category/scheme/year drive the hub's own filtering (playground/hub/
// view-model.js). category is one of the Category filter's three options;
// scheme mirrors it for a document whose category is Countryside
// Stewardship or Sustainable Farming Incentive (matching one of the Scheme
// filter's two checkboxes) and is left unset otherwise — a Cross Compliance
// document has no scheme checkbox to match, so it simply never matches
// either one, same as ticking a scheme that genuinely does not apply to it.
// year is lastUpdated's year, as a number.
//
// The export below (metadataDocuments — read only by ./index.js, which
// merges it with content and .docx-loaded documents into the
// guidanceDocuments every other call site reads) is exactly these 23
// entries, in this order; nothing here loads or reorders anything.
//

module.exports = [
  {
    id: 'cs-ma-revenue-options-claim-rule-signoff-2026',
    title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026',
    description:
      'Sets out the claim rule checks applied to revenue options at signoff, including how conflicting or overlapping claims are identified and resolved.',
    version: 'Version 1',
    lastUpdated: '20 July 2025',
    published: '3 March 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 July 2025',
        published: '3 March 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '18 September 2025',
        published: '2 September 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026',
    title:
      'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026',
    description:
      'Explains what happens when the recorded land use or land cover does not match the requirements of a selected option at the point of signoff, and how to resolve the mismatch.',
    version: 'Version 2',
    lastUpdated: '12 June 2025',
    published: '15 January 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '10 November 2023',
        published: '3 October 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '12 June 2025',
        published: '15 January 2024',
        versionNotes:
          'Updated to clarify how land use and land cover mismatches are resolved at signoff.'
      }
    }
  },
  {
    id: 'cs-ma-agreement-level-options-not-verified-2026',
    title: 'CS MA Claim - Agreement Level Options not Verified 2026',
    description:
      'Covers the verification checks for agreement-level options, including what evidence is required before an option can be confirmed as verified.',
    version: 'Version 1',
    lastUpdated: '2 May 2025',
    published: '9 November 2023',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '2 May 2025',
        published: '9 November 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '14 July 2025',
        published: '30 June 2025',
        versionNotes:
          'Clarified evidence requirements for agreement-level verification checks.'
      }
    }
  },
  {
    id: 'cs-ma-claim-refresh-signoff-check-2026',
    title: 'CS MA Claim - Claim Refresh Signoff Check 2026',
    description:
      'Describes the checks run when a claim is refreshed ahead of signoff, including how updated data is reconciled against the original claim.',
    version: 'Version 2',
    lastUpdated: '28 April 2025',
    published: '1 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 November 2024',
        published: '12 September 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '28 April 2025',
        published: '1 February 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-evidence-required-2026',
    title: 'CS MA - Evidence Required',
    description:
      "Sets out what supporting evidence is needed before a CS MA claim can proceed, and how to request it from the claimant if it's missing.",
    version: 'Version 2',
    lastUpdated: '18 August 2026',
    published: '22 April 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '10 March 2025',
        published: '2 January 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '18 August 2026',
        published: '22 April 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-parcel-not-under-control-of-sbi-signoff-2026',
    title: 'CS MA - Parcel not Under Control of SBI at Signoff 2026',
    description:
      "Explains the checks required when a claimed parcel is not recorded as under the control of the claimant's SBI at the point of signoff, and how to resolve the discrepancy.",
    version: 'Version 1',
    lastUpdated: '3 July 2026',
    published: '11 December 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 July 2026',
        published: '11 December 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '20 September 2026',
        published: '5 September 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-ab12-op3-maximum-eligible-weight-2026',
    title: 'CS MA Claim - AB12 or OP3 Maximum Eligible Weight 2026',
    description:
      'Covers the maximum eligible weight checks applied to AB12 and OP3 options, including how to identify and correct claims that exceed the eligible threshold.',
    version: 'Version 2',
    lastUpdated: '27 May 2026',
    published: '6 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 November 2024',
        published: '3 October 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '27 May 2026',
        published: '6 February 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-existing-2026',
    title: 'CS MA Claim - Existing 2026',
    description:
      'Guidance on handling claims linked to an existing agreement, including how to verify continuity of options and options carried over from the previous scheme year.',
    version: 'Version 1',
    lastUpdated: '9 April 2026',
    published: '19 September 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '9 April 2026',
        published: '19 September 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '30 June 2026',
        published: '15 June 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    // Added, along with the nine CS MA entries below it, purely so the hub
    // (formerly organic-search.html) has enough results to exercise
    // pagination — see playground/hub/view-model.js.
    id: 'cs-ma-claim-duplicate-option-code-check-2026',
    title: 'CS MA Claim - Duplicate Option Code Check 2026',
    description:
      'Sets out how to identify and resolve cases where the same option code has been claimed more than once within a single agreement year.',
    version: 'Version 1',
    lastUpdated: '12 August 2026',
    published: '18 February 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '12 August 2026',
        published: '18 February 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '30 September 2026',
        published: '10 September 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-ineligible-land-cover-type-2026',
    title: 'CS MA Claim - Ineligible Land Cover Type 2026',
    description:
      "Explains the checks applied when a claimed parcel's land cover type does not match the eligibility requirements for the selected option.",
    version: 'Version 2',
    lastUpdated: '22 July 2026',
    published: '5 October 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '15 August 2024',
        published: '3 June 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '22 July 2026',
        published: '5 October 2024',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-late-claim-submission-rule-2026',
    title: 'CS MA Claim - Late Claim Submission Rule 2026',
    description:
      'Covers how claims submitted after the deadline are flagged, and the checks required before a late submission can be accepted.',
    version: 'Version 1',
    lastUpdated: '3 June 2026',
    published: '14 January 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 June 2026',
        published: '14 January 2025',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '20 August 2026',
        published: '5 August 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-missing-supporting-evidence-2026',
    title: 'CS MA - Missing Supporting Evidence 2026',
    description:
      'Details the process for requesting missing supporting evidence from a claimant before a claim can progress to signoff.',
    version: 'Version 2',
    lastUpdated: '29 May 2026',
    published: '9 March 2025',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 January 2025',
        published: '2 December 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '29 May 2026',
        published: '9 March 2025',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-cross-agreement-boundary-overlap-2026',
    title: 'CS MA Claim - Cross Agreement Boundary Overlap 2026',
    description:
      'Explains how to investigate and resolve cases where claimed parcels overlap with a boundary from a different agreement.',
    version: 'Version 1',
    lastUpdated: '16 April 2026',
    published: '27 November 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '16 April 2026',
        published: '27 November 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '10 July 2026',
        published: '22 June 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-historic-environment-feature-check-2026',
    title: 'CS MA Claim - Historic Environment Feature Check 2026',
    description:
      'Sets out the checks required when a claimed option is located near a recorded historic environment feature.',
    version: 'Version 2',
    lastUpdated: '8 March 2026',
    published: '20 August 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '5 July 2024',
        published: '14 May 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '8 March 2026',
        published: '20 August 2024',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-option-stacking-compatibility-2026',
    title: 'CS MA Claim - Option Stacking Compatibility 2026',
    description:
      'Covers the compatibility rules for stacking multiple options on the same parcel, and how to identify conflicting combinations.',
    version: 'Version 1',
    lastUpdated: '19 February 2026',
    published: '2 July 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '19 February 2026',
        published: '2 July 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '25 May 2026',
        published: '9 May 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-withdrawn-claim-reinstatement-2026',
    title: 'CS MA - Withdrawn Claim Reinstatement 2026',
    description:
      'Explains the process for reinstating a previously withdrawn claim where the claimant has provided a valid reason.',
    version: 'Version 2',
    lastUpdated: '11 January 2026',
    published: '30 September 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 August 2024',
        published: '3 July 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '11 January 2026',
        published: '30 September 2024',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-payment-rate-recalculation-2026',
    title: 'CS MA Claim - Payment Rate Recalculation 2026',
    description:
      "Sets out when a claim's payment rate must be recalculated following a change in scheme rates or claimed area.",
    version: 'Version 1',
    lastUpdated: '24 December 2025',
    published: '16 May 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '24 December 2025',
        published: '16 May 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '15 March 2026',
        published: '27 February 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-ma-claim-agreement-holder-change-notification-2026',
    title: 'CS MA Claim - Agreement Holder Change Notification 2026',
    description:
      'Covers the checks required when a change of agreement holder is notified partway through a claim year.',
    version: 'Version 2',
    lastUpdated: '5 November 2025',
    published: '12 April 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 February 2024',
        published: '10 January 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '5 November 2025',
        published: '12 April 2024',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'higher-tier-stewardship-options',
    title: 'Higher Tier stewardship options',
    description:
      'An overview of the options available under a Higher Tier Countryside Stewardship agreement and how they differ from Mid Tier.',
    version: 'Version 1',
    lastUpdated: '14 March 2025',
    published: '20 August 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2025,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '14 March 2025',
        published: '20 August 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '22 May 2025',
        published: '5 May 2025',
        versionNotes:
          'Clarified eligibility criteria for land with high environmental value.'
      }
    }
  },
  {
    id: 'countryside-stewardship-capital-grants',
    title: 'Countryside Stewardship: capital grants',
    description:
      'Explains the capital items available under Countryside Stewardship, including fencing and hedgerow restoration, and how to apply for a grant.',
    version: 'Version 1',
    lastUpdated: '12 August 2026',
    published: '4 February 2024',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '12 August 2026',
        published: '4 February 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '3 October 2026',
        published: '20 September 2026',
        versionNotes:
          'Updated capital item payment rates and clarified fencing specification requirements.'
      }
    }
  },
  {
    id: 'basic-payment-scheme-closing-rules',
    title: 'Basic Payment Scheme: closing rules',
    description:
      'Sets out what still applies to farmers with BPS entitlements or open legacy claims now the scheme has closed to new claims.',
    version: 'Version 2',
    lastUpdated: '5 August 2026',
    published: '11 September 2023',
    // No scheme — BPS is neither Countryside Stewardship nor Sustainable
    // Farming Incentive, and the Scheme filter has no third checkbox for
    // Cross Compliance, so this document simply never matches either one.
    category: 'Cross Compliance',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '19 June 2023',
        published: '2 May 2023',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '5 August 2026',
        published: '11 September 2023',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'sfi-soil-health-actions',
    title: 'Sustainable Farming Incentive: soil health actions',
    description:
      'Explains the soil health actions available under SFI 23, what evidence to keep, and how they interact with other actions on the same land.',
    version: 'Version 1',
    lastUpdated: '3 July 2026',
    published: '22 April 2024',
    category: 'Sustainable Farming Incentive',
    scheme: 'Sustainable Farming Incentive',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '3 July 2026',
        published: '22 April 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '29 August 2026',
        published: '14 August 2026',
        versionNotes:
          'Clarified soil testing evidence requirements and updated payment rates.'
      }
    }
  },
  {
    // Added for the "Awaiting approval" tab on manage-guidance's own data
    // (app/data/manage-guidance.js) — that row named "Hedgerow management
    // standards" had no version field of its own to look a version tag up
    // from, so it's defined here too.
    id: 'hedgerow-management-standards',
    title: 'Hedgerow management standards',
    description:
      'Covers cutting dates, buffer strips and record keeping for hedgerows under cross compliance and SFI actions.',
    version: 'Version 1',
    lastUpdated: '20 July 2026',
    published: '15 March 2024',
    category: 'Cross Compliance',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '20 July 2026',
        published: '15 March 2024',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '2 October 2026',
        published: '18 September 2026',
        versionNotes:
          'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'cs-revenue-claims-processing-final-payment-guide',
    title: 'CS Revenue Claims Processing to Final Payment Guide',
    description:
      "This guide covers the SITI Agri processing of Domestic CS Revenue Payment Claims (Higher Tier and Mid-Tier CS schemes) to be able to make a 'Final Payment'.",
    version: 'Version 1',
    lastUpdated: '28 August 2026',
    published: '28 August 2026',
    category: 'Countryside Stewardship',
    scheme: 'Countryside Stewardship',
    year: 2026,
    versions: {
      version1: {
        label: 'Version 1',
        lastUpdated: '28 August 2026',
        published: '28 August 2026',
        versionNotes: 'Initial published version of this guidance.'
      },
      version2: {
        label: 'Version 2',
        lastUpdated: '28 August 2026',
        published: '28 August 2026',
        versionNotes: 'Placeholder for future revision.'
      }
    }
  }
]
