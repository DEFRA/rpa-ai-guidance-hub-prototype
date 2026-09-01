//
// Full document data for organic-search.html's results, and the two pages a
// result leads to: document-overview.html and saved-document-view.html
// (rendered at /find-guidance/document/:id). One entry per id covers
// everything all three pages need — title, description, version tag, and
// the last updated/published dates — so clicking through from a specific
// result on organic-search.html shows that same document all the way
// through, rather than document-overview.html and saved-document-view.html
// each defaulting to whichever document their own hardcoded data happened
// to have first.
//
// 'higher-tier-stewardship-options', 'countryside-stewardship-capital-grants',
// 'basic-payment-scheme-closing-rules' and 'sfi-soil-health-actions' reuse
// their ids and title/description from app/data/search-results.js — the
// three latter ones are read by find-guidance.html's "Saved guidance" tab
// (app/routes.js), the same way 'higher-tier-stewardship-options' already is
// by organic-search.html, so a row there resolves to the same document
// wherever it is opened from. The four CS MA ids are new — those results do
// not exist in search-results.js at all.
//
// showOnOrganicSearch marks the five entries organic-search.html's own
// results list shows (app/routes.js filters on it for that route) — the
// three added later purely for the "Saved guidance" tab above do not carry
// it, so adding them here does not also change what organic-search.html
// shows.
//
// versions (document-overview.html's Version dropdown) is additional detail
// alongside, not instead of, the top-level version/lastUpdated/published
// fields above — those three keep driving the Version tag on
// organic-search.html and find-guidance.html exactly as before. Whichever of
// versions.version1/version2 matches the top-level version repeats the same
// lastUpdated/published values (see app/routes.js, which also works out
// which key that is); the other is invented placeholder detail for a version
// that either came before it or has not been published yet, always dated
// earlier/later accordingly so the two stay in a sensible order.
//

const guidanceDocuments = [
  {
    id: 'cs-ma-revenue-options-claim-rule-signoff-2026',
    title: 'CS MA Claim - Revenue Options Claim Rule at Signoff 2026',
    description: 'Sets out the claim rule checks applied to revenue options at signoff, including how conflicting or overlapping claims are identified and resolved.',
    version: 'Version 1',
    lastUpdated: '20 July 2025',
    published: '3 March 2025',
    showOnOrganicSearch: true,
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
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    },
    // The only document with its own accurate step content — every other
    // entry in this file is read by saved-document-view.html's generic
    // 3-phase placeholder flow instead (see app/routes.js and the
    // customSteps handling in that template). A body array entry that is
    // itself an array renders as a bulleted list; the literal string
    // 'CASE_NOTE_BLOCK' in the last step renders the fixed case-note
    // template block instead of a paragraph — see saved-document-view.html.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'Introduction',
        heading: 'Introduction',
        body: [
          'There are instances where, when specific option codes and checks are present, no investigation is required, and the case can be closed. If the only options/checks present are:',
          [
            'AB1, AB8 and/or AB15 and the check solely relates to checks being required against the IAPA layer, historic and moorland layers',
            'If the check solely relates to checks being required against historical feature layers e.g. HS5 [SHINE, SAM, Registered Battlefields, Parks and Gardens]',
            'GS1, WD7, WD8, WT1, WT2, HS2, HS3, HS4 and/or HS9 and the check solely relates to checks being required against the Historical layer',
            'LH1 and/or LH2 and the check solely relates to checks being required against the Heathland layer',
            'GS4, WD3, AB3 and/or AB13 and the check solely relates to checks being required against the Historical layer and Moorland'
          ]
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Assign case',
        heading: 'Assign case',
        body: [
          'Is the option being checked AB5 against the Historical layer and Moorland?',
          'If "Yes": cross check the options map (found on CRM) with the HEFER/FER to ensure the option is eligible. If the options map is unavailable, request an updated options map that confirms the AB5 location for the current revenue claim year from the Agreement Holder.',
          'If "No": continue to the next step.'
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'Work the anomaly',
        heading: 'Work the anomaly',
        body: [
          'Have other options been identified that relate to other checks not mentioned above?',
          'If "No", go to section 4.2 Close Case.',
          'If "Yes", continue investigating the anomaly using the relevant checks for those options.'
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'Close case',
        heading: 'Close case',
        body: [
          "Input the following standard case note within the 'CS MA Claim – Revenue Option Claim Rule at Signoff' case, completing the highlighted parts. Once completed, format the note to plain black text.",
          'CASE_NOTE_BLOCK'
        ]
      }
    ]
  },
  {
    id: 'cs-ma-land-user-or-land-cover-not-compatible-signoff-2026',
    title: 'CS MA Claim - Land User or Land Cover not compatible with Option at Signoff 2026',
    description: 'Explains what happens when the recorded land use or land cover does not match the requirements of a selected option at the point of signoff, and how to resolve the mismatch.',
    version: 'Version 2',
    lastUpdated: '12 June 2025',
    published: '15 January 2024',
    showOnOrganicSearch: true,
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
        versionNotes: 'Updated to clarify how land use and land cover mismatches are resolved at signoff.'
      }
    },
    // A body string can contain one or more {{LINK:label text}} markers —
    // see the renderLinkMarkers filter (app/filters.js), applied generically
    // to every body paragraph/bullet in saved-document-view.html, not just
    // this document's. Each marker becomes a non-navigating, govuk-link-styled
    // placeholder for guidance that does not have a real page to link to yet.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'Force Majeure / Obvious Error review',
        heading: '1. Force Majeure / Obvious Error review',
        body: [
          'Where the claimant is wishing to claim less on a parcel/option that is detailed within their agreement this may be because:',
          [
            'The claimant has simply made a mistake when completing their claim form i.e. an Obvious Error, or',
            'The claimant has had to reduce the amount they can claim against due to unforeseen circumstances i.e. Force Majeure.'
          ],
          'Complete a review of CRM to confirm if any correspondence has been received which would explain the reason the claimant wishes to reduce the amount being claimed on, refer to the guide {{LINK:CRM Advanced Find}}.',
          'Was claimant correspondence identified?',
          [
            "If 'No' continue to section 2.2 Land checks to investigate.",
            "If 'Yes' investigate the correspondence provided by the claimant, refer to either:"
          ],
          [
            '{{LINK:Aide for dealing with Force Majeure requests guidance}}',
            '{{LINK:Obvious Error guidance}}'
          ],
          'Continue to section 2.2 Land checks to investigate.'
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Land checks - check types',
        heading: '2. Land checks to investigate',
        body: [
          "The type of check you need to investigate is shown within the 'Description' box as follows:",
          [
            'Options Compatibility.',
            'Land Use Compatibility.',
            'Land Use to Land Cover Compatibility.'
          ]
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'Land checks - closing BE3 cases',
        heading: 'Notes box guidance',
        body: [
          "The 'Notes' box offers background around the case trigger and options that require investigation, as follows:",
          "If the only option code present is BE3 you can close the 'CS MA CLAIM – LAND USE OR LAND COVER NOT COMPATIBLE WITH OPTIONS AT SIGNOFF' case with the following standard case note, completing the parts in red. Once completed format note to black text and close the case, for guidance refer to the SITI Agri Basic Navigation Guide section 15 'Close a case'."
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'Supplement options warning',
        heading: 'Important note on supplement options',
        body: [
          'Note: Case management warnings may only include base options. You must cross check for any supplement options that are in the Agreement and include these when closing cases. For example, an option can sit (be located) by itself on a parcel, however a supplement requires a [content incomplete — placeholder text, to be finished].'
        ]
      }
    ]
  },
  {
    id: 'cs-ma-agreement-level-options-not-verified-2026',
    title: 'CS MA Claim - Agreement Level Options not Verified 2026',
    description: 'Covers the verification checks for agreement-level options, including what evidence is required before an option can be confirmed as verified.',
    version: 'Version 1',
    lastUpdated: '2 May 2025',
    published: '9 November 2023',
    showOnOrganicSearch: true,
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
        versionNotes: 'Clarified evidence requirements for agreement-level verification checks.'
      }
    }
  },
  {
    id: 'cs-ma-claim-refresh-signoff-check-2026',
    title: 'CS MA Claim - Claim Refresh Signoff Check 2026',
    description: 'Describes the checks run when a claim is refreshed ahead of signoff, including how updated data is reconciled against the original claim.',
    version: 'Version 2',
    lastUpdated: '28 April 2025',
    published: '1 February 2025',
    showOnOrganicSearch: true,
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
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'higher-tier-stewardship-options',
    title: 'Higher Tier stewardship options',
    description: 'An overview of the options available under a Higher Tier Countryside Stewardship agreement and how they differ from Mid Tier.',
    version: 'Version 1',
    lastUpdated: '14 March 2025',
    published: '20 August 2024',
    showOnOrganicSearch: true,
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
        versionNotes: 'Clarified eligibility criteria for land with high environmental value.'
      }
    }
  },
  {
    id: 'countryside-stewardship-capital-grants',
    title: 'Countryside Stewardship: capital grants',
    description: 'Explains the capital items available under Countryside Stewardship, including fencing and hedgerow restoration, and how to apply for a grant.',
    version: 'Version 1',
    lastUpdated: '12 August 2026',
    published: '4 February 2024',
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
        versionNotes: 'Updated capital item payment rates and clarified fencing specification requirements.'
      }
    }
  },
  {
    id: 'basic-payment-scheme-closing-rules',
    title: 'Basic Payment Scheme: closing rules',
    description: 'Sets out what still applies to farmers with BPS entitlements or open legacy claims now the scheme has closed to new claims.',
    version: 'Version 2',
    lastUpdated: '5 August 2026',
    published: '11 September 2023',
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
        versionNotes: 'Updated to reflect revised scheme requirements and clarify eligibility criteria.'
      }
    }
  },
  {
    id: 'sfi-soil-health-actions',
    title: 'Sustainable Farming Incentive: soil health actions',
    description: 'Explains the soil health actions available under SFI 23, what evidence to keep, and how they interact with other actions on the same land.',
    version: 'Version 1',
    lastUpdated: '3 July 2026',
    published: '22 April 2024',
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
        versionNotes: 'Clarified soil testing evidence requirements and updated payment rates.'
      }
    }
  },
  {
    id: 'cs-revenue-claims-processing-final-payment-guide',
    title: 'CS Revenue Claims Processing to Final Payment Guide',
    description: "This guide covers the SITI Agri processing of Domestic CS Revenue Payment Claims (Higher Tier and Mid-Tier CS schemes) to be able to make a 'Final Payment'.",
    version: 'Version 1',
    lastUpdated: '28 August 2026',
    published: '28 August 2026',
    showOnOrganicSearch: true,
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
    },
    // Second document (after cs-ma-revenue-options-claim-rule-signoff-2026)
    // with its own accurate step content, driven by the same generic
    // customSteps handling in app/routes.js and saved-document-view.html —
    // no template changes needed for this document, just this entry.
    steps: [
      {
        sectionNumber: 1,
        sectionName: 'RECEIVED to IN CHECKING',
        heading: 'RECEIVED to IN CHECKING',
        body: [
          "Upon completion of Data Alignment activity, claims are bulk transitioned from 'RECEIVED' to 'IN CHECKING'."
        ]
      },
      {
        sectionNumber: 2,
        sectionName: 'Auto-population of claim data',
        heading: 'Auto-population of claim data',
        body: [
          "Upon certain transitions, the system auto populates the claim form questions 'in the positive' so that this manual activity is no longer required. The claim progresses unless there are any 'blocking' non-closed cases in Case Management or system action is required.",
          "Auto population of a claim's verified values with declared values happens on the transition from 'RECEIVED' to 'IN CHECKING'. This populates the 'Y'/'N' radio button with a 'Y'."
        ]
      },
      {
        sectionNumber: 3,
        sectionName: 'IN CHECKING to READY FOR SIGN OFF',
        heading: 'IN CHECKING to READY FOR SIGN OFF',
        body: [
          "A bulk transition attempts to move claims from 'IN CHECKING' to 'READY FOR SIGN OFF' allowing the scheme rules to run. Where these rules fail, case managements may be generated for investigation, and the claim status is set at 'IN CORRECTION'."
        ]
      },
      {
        sectionNumber: 4,
        sectionName: 'IN CORRECTION to READY FOR SIGN OFF',
        heading: 'IN CORRECTION to READY FOR SIGN OFF',
        body: [
          "Once all case activity is complete, the claim transition from 'IN CORRECTION' to 'READY FOR SIGN OFF' can be attempted, allowing the claim to be paid."
        ]
      }
    ]
  }
]

module.exports = { guidanceDocuments }
