//
// Guidance content for documents that use the generic 3-phase placeholder
// flow on saved-document-view.html (v5) and editor-experiment.html (v5) —
// extracted verbatim from saved-document-view.html's own former
// {% set documents = {...} %} block (a template-local literal, moved here
// so editor-experiment.html's route can read the same content server-side
// rather than duplicating several hundred lines of it a second time).
//
// Keyed by guidance-documents.js id; a document not present here is not an
// error — both templates fall back to countryside-stewardship-capital-grants
// for any id that doesn't match one of these five, exactly as
// saved-document-view.html already did before this file existed.
//
const documents = {
  'countryside-stewardship-capital-grants': {
    sections: [
      {
        id: 'introduction',
        heading: 'Introduction',
        subsections: [
          {
            id: 'introduction-overview',
            heading: 'Overview',
            content: [
              "Capital grants under Countryside Stewardship pay towards physical improvements on your land, such as new fencing, hedgerow restoration and watercourse fencing. They're aimed at land managers who want to invest in specific items rather than commit to an ongoing management agreement.",
              "Payment is a fixed rate per item rather than a percentage of what you spend, so you'll know in advance what a grant is worth before you apply."
            ]
          },
          {
            id: 'introduction-purpose-of-this-guidance',
            heading: 'Purpose of this guidance',
            content: [
              'This guidance sets out what to expect before you start an application, including which items are eligible, how applications are assessed, and what happens once your grant is approved.',
              "It's designed to be read before you contact an adviser or begin drafting a capital works plan, so you understand the process from the outset."
            ]
          }
        ],
        additionalInfo: [
          'This document only covers capital grants — ongoing management options are covered separately in the main Countryside Stewardship handbook.'
        ]
      },
      {
        id: 'whats-covered',
        heading: "What's covered",
        subsections: [
          {
            id: 'whats-covered-eligible-items',
            heading: 'Eligible items',
            content: [
              'The most commonly claimed items are fencing, hedgerow restoration and watercourse fencing, all listed in the capital items list along with their fixed payment rates.',
              'A grant can be claimed alongside an existing Mid Tier or Higher Tier Countryside Stewardship agreement, or applied for on its own with no ongoing management commitment attached.'
            ]
          },
          {
            id: 'whats-covered-exclusions',
            heading: 'Exclusions',
            content: [
              'Routine maintenance of existing infrastructure, such as repairing an existing fence line, is not covered — the scheme only funds new capital works.',
              "If you're unsure whether an item counts as new work or maintenance, check the capital items list or speak to an adviser before you apply, since misclassified items can delay your application."
            ]
          }
        ],
        additionalInfo: [
          'Capital item rates are reviewed annually and can change between application windows.'
        ]
      },
      {
        id: 'how-to-apply',
        heading: 'How to apply',
        subsections: [
          {
            id: 'how-to-apply-application-process',
            heading: 'Application process',
            content: [
              "Applications are submitted through the Rural Payments service, where you'll list each item and quantity you're applying for.",
              "Applications are assessed in batches rather than on a rolling basis, so you'll need to submit within the published application window for that year — missing it means waiting for the next round."
            ]
          },
          {
            id: 'how-to-apply-supporting-evidence',
            heading: 'Supporting evidence',
            content: [
              'Larger items, such as new hedgerows or extensive fencing runs, need a capital works plan or map submitted alongside your application.',
              'Keep any supporting photos, quotes or measurements you used to prepare your application, since these may be requested during assessment.'
            ]
          }
        ],
        additionalInfo: [
          'The application window is published separately from the main SFI application dates.'
        ]
      },
      {
        id: 'payments',
        heading: 'Payments',
        subsections: [
          {
            id: 'payments-payment-rates',
            heading: 'Payment rates',
            content: [
              "Payment rates are set per item and published in the capital items list. They're reviewed annually, so the rate that applied when you applied may differ slightly from a later application window.",
              'Rates reflect a fixed contribution towards the item rather than the full cost, so your own costings should account for any difference.'
            ]
          },
          {
            id: 'payments-payment-schedule',
            heading: 'Payment schedule',
            content: [
              'Payment is made once an item is complete and evidence has been submitted — usually photographs and, for some items, a supplier invoice.',
              'Items must then be maintained for a minimum period set out in your agreement. If an item is removed or falls into disrepair within that period, the payment may be reclaimed.'
            ]
          }
        ],
        additionalInfo: [
          'This document does not cover Higher Tier capital items, which are agreed individually as part of that agreement.'
        ]
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        subsections: [
          {
            id: 'common-mistakes-applying-for-ineligible-items',
            heading: 'Applying for ineligible items',
            content: [
              'Some land managers apply for items not on the capital items list, such as general repairs, which are rejected at assessment rather than during application.'
            ]
          },
          {
            id: 'common-mistakes-missing-supporting-evidence',
            heading: 'Missing supporting evidence',
            content: [
              'Applications without a capital works plan for larger items are one of the most common reasons for a request for further information.'
            ]
          }
        ],
        additionalInfo: [
          'Checking an application against the capital items list before submitting avoids most of these delays.'
        ]
      },
      {
        id: 'related-schemes',
        heading: 'Related schemes',
        subsections: [
          {
            id: 'related-schemes-mid-tier',
            heading: 'Countryside Stewardship Mid Tier',
            content: [
              'Capital grants can sit alongside a Mid Tier agreement, which covers ongoing management options rather than one-off items.'
            ]
          },
          {
            id: 'related-schemes-higher-tier',
            heading: 'Countryside Stewardship Higher Tier',
            content: [
              'Higher Tier agreements can also include capital items, agreed individually as part of that wider agreement.'
            ]
          }
        ],
        additionalInfo: [
          'A capital grant does not commit you to either tier — it can be applied for on its own.'
        ]
      }
    ]
  },

  'basic-payment-scheme-closing-rules': {
    sections: [
      {
        id: 'introduction',
        heading: 'Introduction',
        subsections: [
          {
            id: 'introduction-overview',
            heading: 'Overview',
            content: [
              'The Basic Payment Scheme (BPS) closed to new claims in 2024, but a number of obligations and rights still apply to farmers who hold entitlements or have an open legacy claim.',
              'This document summarises what those farmers still need to know, without covering the closed application process itself.'
            ]
          },
          {
            id: 'introduction-purpose-of-this-guidance',
            heading: 'Purpose of this guidance',
            content: [
              'This guidance is aimed at farmers who already hold BPS entitlements or have a claim still being processed, helping them understand what happens next now the scheme has closed.',
              'It does not cover new applications, since none can be submitted — for ongoing land management support, see the Sustainable Farming Incentive guidance instead.'
            ]
          }
        ],
        additionalInfo: [
          'BPS is fully replaced by Environmental Land Management schemes going forward.'
        ]
      },
      {
        id: 'closing-timetable',
        heading: 'Closing timetable',
        subsections: [
          {
            id: 'closing-timetable-final-claim-window',
            heading: 'Final claim window',
            content: [
              'The final BPS claim window closed in May 2024. No new claims can be submitted after this date, regardless of whether you held entitlements before closure.',
              'If you missed the final window, your only options now are the schemes that have replaced BPS, such as the Sustainable Farming Incentive.'
            ]
          },
          {
            id: 'closing-timetable-open-queries',
            heading: 'What happens to open queries',
            content: [
              'Claims made before the scheme closed are still being resolved individually, so you may still hear from the Rural Payments Agency about a claim submitted before May 2024.',
              "Response times vary depending on the complexity of the claim and whether further evidence is needed, so it's worth keeping your own records until a claim is fully settled."
            ]
          }
        ],
        additionalInfo: [
          'No further claim windows will open — this was the final one.'
        ]
      },
      {
        id: 'entitlements',
        heading: 'Entitlements',
        subsections: [
          {
            id: 'entitlements-entitlement-value',
            heading: 'Entitlement value',
            content: [
              'Entitlements only ever had value as part of an active BPS claim, and that value has not carried over to any other scheme.',
              'Holding unused entitlements does not entitle you to any ongoing payment or benefit now that BPS itself has closed.'
            ]
          },
          {
            id: 'entitlements-transfers-and-sales',
            heading: 'Transfers and sales',
            content: [
              'Entitlements can no longer be transferred or sold, since the market for them closed along with the scheme itself.',
              'If you were part-way through a transfer when the scheme closed, contact the Rural Payments Agency directly, as standard transfer processes are no longer available.'
            ]
          }
        ],
        additionalInfo: [
          'Entitlement records are retained for reference even though they can no longer be used.'
        ]
      },
      {
        id: 'final-claims-and-appeals',
        heading: 'Final claims and appeals',
        subsections: [
          {
            id: 'final-claims-and-appeals-requesting-a-review',
            heading: 'Requesting a review',
            content: [
              'If you believe a final BPS payment was calculated incorrectly, you can still request a review even though the scheme itself has closed.',
              "Reviews are handled the same way they always were — you'll need to explain what you believe is wrong and provide any evidence that supports your case."
            ]
          },
          {
            id: 'final-claims-and-appeals-appeal-timescales',
            heading: 'Appeal timescales',
            content: [
              "You have the standard 60-day window from the date of the decision to request a review, so it's worth acting quickly once you receive a final payment notice.",
              'Requests made outside this window are unlikely to be considered, except in exceptional circumstances.'
            ]
          }
        ],
        additionalInfo: [
          'Historic claim data is retained for 6 years for audit purposes.'
        ]
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        subsections: [
          {
            id: 'common-mistakes-assuming-entitlements-still-have-value',
            heading: 'Assuming entitlements still have value',
            content: [
              'Some farmers mistakenly believe unused entitlements can still be sold or transferred now the scheme has closed.'
            ]
          },
          {
            id: 'common-mistakes-missing-the-appeal-window',
            heading: 'Missing the appeal window',
            content: [
              'Requests for a review submitted after the 60-day window are rarely accepted, even with a strong case.'
            ]
          }
        ],
        additionalInfo: [
          'Acting as soon as a final payment notice arrives leaves the most time to prepare a review request.'
        ]
      },
      {
        id: 'related-schemes',
        heading: 'Related schemes',
        subsections: [
          {
            id: 'related-schemes-sfi',
            heading: 'Sustainable Farming Incentive',
            content: [
              'SFI is one of the schemes farmers have moved to since BPS closed to new claims.'
            ]
          },
          {
            id: 'related-schemes-elm',
            heading: 'Environmental Land Management schemes',
            content: [
              'BPS has been fully replaced by the wider Environmental Land Management offer.'
            ]
          }
        ],
        additionalInfo: [
          'Neither scheme carries over BPS entitlements — each has its own separate eligibility rules.'
        ]
      }
    ]
  },

  'hedgerow-management-standards': {
    sections: [
      {
        id: 'introduction',
        heading: 'Introduction',
        subsections: [
          {
            id: 'introduction-overview',
            heading: 'Overview',
            content: [
              'Hedgerows are protected by a combination of cross compliance rules and specific SFI actions, both of which set out when they can and cannot be cut, and what must be left in place.',
              "This document brings those standards together in one place, since they're often referenced separately across different scheme handbooks."
            ]
          },
          {
            id: 'introduction-purpose-of-this-guidance',
            heading: 'Purpose of this guidance',
            content: [
              'This guidance sets out when hedgerow cutting restrictions apply, and the specific circumstances in which they can be relaxed, such as clearing a public right of way.',
              "It's intended for anyone responsible for hedgerow management on land within an SFI or Countryside Stewardship agreement, or subject to cross compliance."
            ]
          }
        ],
        additionalInfo: [
          'These standards apply whether or not the hedgerow sits within an SFI or Countryside Stewardship agreement.'
        ]
      },
      {
        id: 'cutting-and-management-dates',
        heading: 'Cutting and management dates',
        subsections: [
          {
            id: 'cutting-and-management-dates-restricted-period',
            heading: 'Restricted period',
            content: [
              'Hedgerows must not be cut between 1 March and 31 August each year, since this covers the main nesting period for farmland birds.',
              'This restriction applies regardless of which scheme your land is in, since it also forms part of cross compliance.'
            ]
          },
          {
            id: 'cutting-and-management-dates-exemptions',
            heading: 'Exemptions',
            content: [
              'A small number of exemptions apply during the restricted period, such as clearing a public right of way or dealing with a safety hazard.',
              'Exemptions should be used sparingly and only for the specific circumstance they cover — routine cutting cannot be brought forward using an exemption.'
            ]
          }
        ],
        additionalInfo: [
          'Some counties have byelaws with earlier cutting restrictions than the national dates above.'
        ]
      },
      {
        id: 'buffer-strips',
        heading: 'Buffer strips',
        subsections: [
          {
            id: 'buffer-strips-minimum-width',
            heading: 'Minimum width',
            content: [
              "The minimum buffer strip width is not fixed across the board — it's set by whichever specific SFI action or cross compliance rule applies to that hedgerow.",
              'Where more than one rule could apply, the wider of the two minimum widths should be used.'
            ]
          },
          {
            id: 'buffer-strips-where-they-apply',
            heading: 'Where buffer strips apply',
            content: [
              'A buffer strip is required alongside any hedgerow that sits next to arable land, to protect it from cultivation and spray drift.',
              'Buffer strips next to grassland are not always required in the same way, so check the specific rule that applies to your land.'
            ]
          }
        ],
        additionalInfo: [
          'Buffer strip widths can vary between actions — check the specific one that applies to your agreement.'
        ]
      },
      {
        id: 'record-keeping-and-enforcement',
        heading: 'Record keeping and enforcement',
        subsections: [
          {
            id: 'record-keeping-and-enforcement-what-to-record',
            heading: 'What to record',
            content: [
              'Keep a simple record of when hedgerows were cut and, where relevant, which exemption was used and why.',
              "A dated photo or note is usually enough — the record just needs to show you can account for what was done and when if it's ever queried."
            ]
          },
          {
            id: 'record-keeping-and-enforcement-consequences',
            heading: 'Consequences of a breach',
            content: [
              'A single breach is usually dealt with as an isolated issue, but repeated breaches can affect payments across every scheme claimed on the holding, not just the action or agreement involved.',
              "If you think a breach may have occurred, it's better to record what happened and seek advice than to wait for it to be identified during an inspection."
            ]
          }
        ],
        additionalInfo: [
          'Local nature recovery strategies may set additional hedgerow requirements beyond this document.'
        ]
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        subsections: [
          {
            id: 'common-mistakes-cutting-during-the-restricted-period',
            heading: 'Cutting during the restricted period',
            content: [
              'Cutting between 1 March and 31 August without a valid exemption is the most common breach reported.'
            ]
          },
          {
            id: 'common-mistakes-incorrect-buffer-strip-width',
            heading: 'Incorrect buffer strip width',
            content: [
              "Using the wrong action's minimum width, rather than the widest rule that applies, is a frequent recording error."
            ]
          }
        ],
        additionalInfo: [
          'Checking every applicable rule before cutting, not just the most familiar one, avoids most width errors.'
        ]
      },
      {
        id: 'appeals-process',
        heading: 'Appeals process',
        subsections: [
          {
            id: 'appeals-process-requesting-a-review',
            heading: 'Requesting a review',
            content: [
              'A breach finding can be reviewed if you believe the restricted period or an exemption was applied incorrectly.'
            ]
          },
          {
            id: 'appeals-process-evidence-for-an-appeal',
            heading: 'Evidence for an appeal',
            content: [
              'Dated photos or records of the cutting date and any exemption used are the main evidence used in a review.'
            ]
          }
        ],
        additionalInfo: [
          'Keeping records at the time, rather than reconstructing them later, makes a review far more straightforward.'
        ]
      }
    ]
  },

  'sfi-soil-health-actions': {
    sections: [
      {
        id: 'introduction',
        heading: 'Introduction',
        subsections: [
          {
            id: 'introduction-overview',
            heading: 'Overview',
            content: [
              'SFI 23 includes a small group of soil health actions covering organic matter, soil structure and herbal leys, each aimed at improving the condition of your soil over time.',
              "They're designed to work together, so most land managers taking one soil health action will find it complements the others rather than competing for the same land."
            ]
          },
          {
            id: 'introduction-purpose-of-this-guidance',
            heading: 'Purpose of this guidance',
            content: [
              "This guidance explains what each soil health action asks you to do, the evidence you'll need to keep, and how the actions interact with each other and with other SFI actions on the same parcel.",
              "It's worth reading in full before you select actions, since some combinations work better together than others."
            ]
          }
        ],
        additionalInfo: [
          'This document does not cover soil actions specific to Countryside Stewardship, which follow a separate handbook.'
        ]
      },
      {
        id: 'actions-available',
        heading: 'Actions available',
        subsections: [
          {
            id: 'actions-available-action-types',
            heading: 'Action types',
            content: [
              'The three main soil health actions are adding organic matter, testing soil structure, and establishing herbal leys, each targeting a different aspect of soil condition.',
              "You don't need to take all three — many land managers choose the one or two actions that best suit their existing rotation and soil type."
            ]
          },
          {
            id: 'actions-available-payment-rates',
            heading: 'Payment rates',
            content: [
              'Each action has its own payment rate and its own management requirement, so the evidence and record-keeping expected differs from one to the next.',
              'Rates are published in the SFI 23 handbook and are reviewed annually alongside the rest of the scheme.'
            ]
          }
        ],
        additionalInfo: [
          'Actions can usually be combined with other SFI actions on the same parcel.'
        ]
      },
      {
        id: 'evidence-you-need-to-keep',
        heading: 'Evidence you need to keep',
        subsections: [
          {
            id: 'evidence-you-need-to-keep-soil-test-results',
            heading: 'Soil test results',
            content: [
              'Keep dated soil test results for every parcel the soil structure action applies to, since results are the main evidence used to confirm the action has been carried out.',
              'Results more than a few years old are unlikely to be accepted as current evidence, so testing needs to be repeated periodically.'
            ]
          },
          {
            id: 'evidence-you-need-to-keep-organic-matter-records',
            heading: 'Records of organic matter added',
            content: [
              'For the organic matter action, keep a simple record of what was added, when it was applied, and which parcel it relates to.',
              'A delivery note or supplier invoice alongside your own application record is usually enough to demonstrate what was used.'
            ]
          }
        ],
        additionalInfo: [
          'Soil testing frequency requirements are reviewed as part of the annual scheme update.'
        ]
      },
      {
        id: 'combining-with-other-actions',
        heading: 'Combining with other actions',
        subsections: [
          {
            id: 'combining-with-other-actions-compatible-actions',
            heading: 'Compatible actions',
            content: [
              'Most soil health actions can be combined with other SFI actions on the same parcel, since they typically address different aspects of land management.',
              'Combining actions can increase the total payment for a parcel, but each action still needs to be fully delivered on its own terms.'
            ]
          },
          {
            id: 'combining-with-other-actions-where-requirements-conflict',
            heading: 'Where requirements conflict',
            content: [
              "Before combining actions, check their combined management requirements don't conflict — for example, a cultivation-based action alongside a no-till requirement on the same parcel.",
              "Where a genuine conflict exists, you'll need to choose which action takes priority on that parcel rather than attempting both."
            ]
          }
        ],
        additionalInfo: [
          'Check the combined management requirements before adding a new action to a parcel already in another.'
        ]
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        subsections: [
          {
            id: 'common-mistakes-outdated-soil-test-results',
            heading: 'Outdated soil test results',
            content: [
              'Soil test results more than a few years old are a common reason evidence is not accepted.'
            ]
          },
          {
            id: 'common-mistakes-incomplete-organic-matter-records',
            heading: 'Incomplete organic matter records',
            content: [
              'Records that do not note the parcel an application relates to are often queried during assessment.'
            ]
          }
        ],
        additionalInfo: [
          'Repeating soil tests on a regular cycle avoids evidence being rejected as out of date.'
        ]
      },
      {
        id: 'related-schemes',
        heading: 'Related schemes',
        subsections: [
          {
            id: 'related-schemes-countryside-stewardship-soil-options',
            heading: 'Countryside Stewardship soil options',
            content: [
              'Countryside Stewardship has its own separate soil actions, covered in a different handbook to SFI 23.'
            ]
          },
          {
            id: 'related-schemes-nutrient-management-planning',
            heading: 'Nutrient management planning',
            content: [
              'Soil health actions often complement a wider nutrient management plan for the same land.'
            ]
          }
        ],
        additionalInfo: [
          'Checking both handbooks before applying avoids duplicating an action already covered elsewhere.'
        ]
      }
    ]
  },

  'higher-tier-stewardship-options': {
    sections: [
      {
        id: 'introduction',
        heading: 'Introduction',
        subsections: [
          {
            id: 'introduction-overview',
            heading: 'Overview',
            content: [
              'Higher Tier Countryside Stewardship offers a wider and more tailored set of options than Mid Tier, aimed at land with particularly high environmental value.',
              'Where Mid Tier options are largely chosen from a fixed list, Higher Tier options are worked out individually with an adviser based on what your land can support.'
            ]
          },
          {
            id: 'introduction-purpose-of-this-guidance',
            heading: 'Purpose of this guidance',
            content: [
              'This guidance is intended to help you decide whether Higher Tier is the right fit for your land before you submit an expression of interest.',
              "It covers who Higher Tier is aimed at, how options are agreed, and what a typical agreement looks like once it's in place."
            ]
          }
        ],
        additionalInfo: [
          'Existing Mid Tier agreements can sometimes be uplifted to Higher Tier without starting a new application.'
        ]
      },
      {
        id: 'who-higher-tier-is-for',
        heading: 'Who Higher Tier is for',
        subsections: [
          {
            id: 'who-higher-tier-is-for-high-value-land',
            heading: 'Land with high environmental value',
            content: [
              'Land that already supports significant habitat, such as species-rich grassland or ancient woodland, is generally a strong fit for Higher Tier.',
              "An adviser assessment is used to confirm environmental value, since it isn't judged on land type alone."
            ]
          },
          {
            id: 'who-higher-tier-is-for-protected-landscapes',
            heading: 'Protected landscapes',
            content: [
              'Land within a protected landscape, such as a National Park or Area of Outstanding Natural Beauty, is often prioritised for Higher Tier funding.',
              'Being within a protected landscape does not guarantee acceptance on its own, but it does strengthen an expression of interest.'
            ]
          }
        ],
        additionalInfo: [
          'Not all high-value land automatically qualifies — an adviser assessment is still required.'
        ]
      },
      {
        id: 'how-options-are-agreed',
        heading: 'How options are agreed',
        subsections: [
          {
            id: 'how-options-are-agreed-adviser-site-visit',
            heading: 'Adviser site visit',
            content: [
              'Higher Tier options are worked out together with an adviser during a site visit, rather than chosen upfront from a fixed list as they are under Mid Tier.',
              "The site visit is used to assess what the land can realistically support, so it's worth preparing any existing habitat records or management history beforehand."
            ]
          },
          {
            id: 'how-options-are-agreed-individually-agreed-options',
            heading: 'Individually agreed options',
            content: [
              'The options that come out of the site visit are tailored specifically to your land, rather than being a standard package applied the same way everywhere.',
              'This means two neighbouring holdings with similar land types can still end up with quite different Higher Tier agreements.'
            ]
          }
        ],
        additionalInfo: [
          'Applying for Higher Tier usually starts with an expression of interest rather than a full application.'
        ]
      },
      {
        id: 'agreement-length-and-review',
        heading: 'Agreement length and review',
        subsections: [
          {
            id: 'agreement-length-and-review-10-year-term',
            heading: '10-year term',
            content: [
              'Higher Tier agreements typically run for 10 years, longer than the standard Mid Tier term, reflecting the more significant environmental outcomes they aim to deliver.',
              'The longer term also gives options like habitat creation enough time to establish properly before the agreement ends.'
            ]
          },
          {
            id: 'agreement-length-and-review-mid-point-review',
            heading: 'Mid-point review',
            content: [
              'A formal review takes place at the mid-point of the agreement to check the agreed options are still appropriate and delivering as expected.',
              'The review can lead to options being adjusted if circumstances on the land have changed significantly since the agreement started.'
            ]
          }
        ],
        additionalInfo: [
          'A poor mid-point review does not automatically end the agreement, but may require an action plan.'
        ]
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        subsections: [
          {
            id: 'common-mistakes-applying-without-an-expression-of-interest',
            heading: 'Applying without an expression of interest',
            content: [
              'Higher Tier applications usually need to start with an expression of interest rather than a direct application.'
            ]
          },
          {
            id: 'common-mistakes-assuming-automatic-acceptance',
            heading: 'Assuming automatic acceptance',
            content: [
              'High environmental value land is not automatically accepted — an adviser assessment is always required.'
            ]
          }
        ],
        additionalInfo: [
          'Starting with an expression of interest, rather than preparing a full application first, avoids wasted work.'
        ]
      },
      {
        id: 'related-schemes',
        heading: 'Related schemes',
        subsections: [
          {
            id: 'related-schemes-mid-tier',
            heading: 'Countryside Stewardship Mid Tier',
            content: [
              'Some existing Mid Tier agreements can be uplifted to Higher Tier without a new application.'
            ]
          },
          {
            id: 'related-schemes-sfi',
            heading: 'Sustainable Farming Incentive',
            content: [
              'SFI actions can sometimes run alongside a Higher Tier agreement on different parcels of the same holding.'
            ]
          }
        ],
        additionalInfo: [
          'Checking with an adviser before combining schemes on the same land avoids a conflict between agreements.'
        ]
      }
    ]
  }
}

module.exports = { documents }
