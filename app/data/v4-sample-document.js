//
// The converted-guidance example for v4's read-only viewer: a mock RPA claim-
// processing guide, converted from "Mock Claim Processing Guidance.docx" into
// the markdown the viewer renders. Standalone from app/data/sample-document.js
// (which the quality checks and editors elsewhere are tuned against) so it can
// grow without disturbing them.
//
// Headings drive the contents list, tables render as GOV.UK tables, and images
// point at the PNGs in app/assets/images, served at /public/images. The leading
// H1 is stripped in app/routes.js because the viewer page already shows the
// title.
//

const v4SampleDocument = `# Processing farmer claims using RPA processors and legacy systems

# Introduction

## Purpose

This guide explains the process for checking and progressing a farmer claim where the claim details must be reviewed by an RPA processor using a legacy operational system. It sets out the order in which checks should be carried out, the decisions a processor needs to make at each stage, and how the outcome should be recorded so that the case can be closed cleanly.

It is intended as a worked, mock example for training and design purposes. The systems, hold codes and reference numbers used are illustrative and should not be relied on for live claim processing.

## Background

The claim may have been received through a newer customer-facing service, but the processor must still check key records in the legacy system. These checks confirm that the Single Business Identifier (SBI), claim reference, land parcel records, payment status and any previous case activity are consistent before a decision is made.

Because information is held across more than one system, the processor acts as the point where those records are reconciled. Where the customer-facing service and the legacy system disagree, the legacy record is treated as the system of record for payment and agreement data unless local guidance states otherwise.

## Scope and assumptions

This guidance covers the end-to-end handling of a single farmer claim case, from locating and allocating the case through to updating the decision and closing the case. It does not cover scheme eligibility policy, appeals, or the recovery of overpayments, which are dealt with under separate guidance.

The guidance assumes that the processor has been granted access to the case management system, the legacy operational system and CRM, has completed the relevant training, and is working from an allocated worklist. It also assumes that the claim has already passed initial validation and has generated a case that requires manual review.

# End-to-end process overview

The diagram below shows the overall sequence a processor follows: the claim is received and allocated, validated against the legacy system, supporting evidence is reviewed, the farmer is contacted where required, and the decision is updated before the case passes a quality check and is closed. The sections that follow describe each stage in detail.

![Process stages shown left to right: claim received, case allocated, legacy system checks, evidence review, farmer contact, decision update, quality check and closure](/public/images/claim-process-strip.png)

![Flowchart of the claim process from claim received through allocation, business identifier and land parcel checks, legacy records validation with an information-complete decision, evidence review, decision update, quality check and case closure](/public/images/claim-process-flow.png)

## Processor responsibilities

The processor is responsible for confirming that the case has been correctly allocated to them, that the claim being worked matches the case that raised it, and that every check is evidenced in the case notes. Decisions must be proportionate, based on the records already held, and consistent across the legacy system and CRM.

Where the processor cannot resolve a discrepancy, or where the evidence does not support a decision, the case must be referred to a team leader rather than progressed. The processor should not change a claim decision until all mandatory checks in this guide have been completed.

### Processor responsibility checklist

| Responsibility | What to check | Expected evidence |
| --- | --- | --- |
| Case ownership | Confirm the case is assigned to the correct processor and is not already being worked by someone else. | Owner field checked and, where needed, confirmation from the previous owner recorded. |
| Record matching | Confirm the claim reference, SBI, agreement year and farmer details match across the case and legacy system. | Case note records the matching references and any discrepancy found. |
| Decision evidence | Confirm the decision is supported by claim, parcel, payment and CRM evidence. | Evidence sources recorded before the claim decision is updated. |
| Escalation | Refer unclear, inconsistent or unsupported cases to a team leader. | Referral note added and case placed on the appropriate hold where required. |

# Find and allocate the claim case

## Allocate the claim case

From the case management worklist, locate the claim case using the claim reference or SBI. Open the case and check the owner field before assigning the case to yourself. Allocating the case prevents two processors from working the same claim at the same time.

Is another processor already shown as the case owner?

- **Yes**, check with that processor before changing ownership. If they are actively working the case, do not take further action unless instructed by your team leader.
- **No**, assign the case to yourself and continue to the next section.

## Check related cases

Before starting the claim investigation, check the case list for any related claim, land, payment or customer-contact cases. This prevents duplicate action and helps ensure the processor has considered all available information.

Are there any related open cases?

- **Yes**, review the case notes and determine whether the related case must be worked first. If the related case affects the claim decision, place this case on hold until the related action is complete.
- **No**, continue to the decision update and closure section after completing the checks below.

### Related case decision table

| Finding | Processor action | Case note requirement |
| --- | --- | --- |
| No related cases found | Continue with the claim investigation. | Record that the related case check was completed and no linked cases were found. |
| Related case found but already closed | Review the outcome and confirm whether it affects the current claim. | Record the closed case reference and whether it changes the next step. |
| Related case open and relevant | Review the case notes and decide whether the related case must be worked first. | Record the linked case reference and place the current case on hold if needed. |
| Related case owned by another processor | Contact the owner before taking action. | Record the discussion outcome and agreed next step. |

# Claim investigation in the legacy system

![A processor at a legacy terminal checking claim reference, SBI, agreement year, land parcels and payment status against the records](/public/images/legacy-investigation.png)

## Open the farmer record

From the case queue, open the farmer record using the SBI. Check that the business name, correspondence address and claim year match the claim record. If another processor is already shown as the owner, confirm they are not actively working the same case before taking action.

For the overall process sequence, see the end-to-end process overview, or continue with the detailed checks below.

## Check claim, SBI and parcel details

Open the claim record in the legacy system and compare the claim reference, SBI, agreement year and land parcel details against the case notes. You must confirm that the claim being worked is the same claim that has raised the case before making any change.

### Claim details check

Do the claim reference, SBI and agreement year match across the case and legacy system?

- **Yes**, continue to the parcel and land details check below.
- **No**, do not update the claim decision. Add a case note explaining the mismatch and refer the case to your team leader.

### Parcel and land details check

Compare the land parcel references, parcel areas and any feature or land-cover details recorded against the claim with the parcels held in the legacy system. Small mapping differences may be acceptable, but any change that affects the claimed area must be evidenced.

Do the parcel references and claimed areas agree with the legacy land records?

- **Yes**, record that the parcel check is complete and continue to the payment status check.
- **No**, note the difference in the case, and where the discrepancy affects the claimed area or eligibility, refer the case for a land query before continuing.

### Payment status check

Check the payment status for the agreement year against the legacy system. Confirm whether any payment has already been made, is pending, or is on hold, so that the decision does not duplicate or contradict an existing payment.

Is the payment status clear and consistent with the decision you expect to make?

- **Yes**, continue to farmer contact if further information is needed, or to the decision update.
- **No**, do not update the decision. Add a case note describing the payment discrepancy and refer the case to your team leader.

### Legacy system investigation checklist

| Check | Source | Pass outcome | Fail outcome |
| --- | --- | --- | --- |
| Claim reference | Case management record and legacy claim record | References match. | Do not update the claim; refer to team leader. |
| SBI and business details | Farmer record and claim record | SBI, business name and agreement year match. | Add discrepancy note and pause processing. |
| Parcel references and area | Claim details and legacy land records | Parcel IDs and claimed areas are consistent or variance is explained. | Refer for land query where discrepancy affects eligibility or area. |
| Payment status | Legacy payment record | Status supports the intended decision. | Refer to team leader before any decision update. |
| CRM correspondence | CRM activities and related cases | Correspondence supports the processor decision or no relevant correspondence found. | Contact farmer or escalate if evidence is unclear. |

# Farmer contact and case notes

![Farmer contact by phone, email or letter recorded in CRM case notes with contact details, discussion notes, next steps, a hold code, a review date and an evidence checklist](/public/images/farmer-contact.png)

Contact should be proportionate and based on the evidence already available. The processor should avoid asking the farmer for information that is already recorded in the legacy system, CRM or land register. Every contact, and every attempt at contact, must be recorded in the case notes.

## Telephone

Where farmer contact is required, telephone contact should be attempted first. The processor must confirm that they are speaking to an authorised person before discussing claim or business details.

Were you able to contact the farmer or authorised agent by telephone?

- **Yes**, record the call outcome in CRM and confirm any agreed action in writing if required.
- **No**, continue to the email or letter route depending on the contact details available.

## Email or letter

If telephone contact is unsuccessful, draft an email where the farmer has a valid email address. If no valid email address is available, or the farmer uses assisted digital support, prepare a letter. The communication must clearly explain what information is required and the date by which the farmer should respond.

When the communication has been sent, place the case on hold and add the case note below. Use HOLD925 where the case is awaiting farmer evidence. Set a review date so the hold is followed up rather than left open.

### Case note (HOLD925)

- HOLD925
- SFI customer contact required.
- SFI mock claim processing guidance v<version>
- Initial contact sent by <email / letter> on <date>.
- Claim reference: <claim reference>
- SBI: <SBI>
- Information requested: <details of evidence or clarification requested>
- Response deadline: <date>
- Review date set: <date>
- <name and date>

### Farmer contact route table

| Scenario | Preferred route | Follow-up action | Suggested hold code |
| --- | --- | --- | --- |
| Authorised farmer or agent contacted and agrees with the proposed action | Telephone, followed by email or letter confirmation where needed | Record call outcome and confirm agreed action in writing if required. | Not required unless awaiting further evidence. |
| No telephone contact but valid email address available | Email | Set response deadline and check CRM for reply. | HOLD925 |
| No valid email address or assisted digital route required | Letter | Record letter issue date and set a review date. | HOLD925 |
| Farmer disputes system records but provides no supporting evidence | Escalation via team leader | Refer for operational advice and record the reason. | HOLD972 |
| Mapping or land evidence requires specialist review | Referral | Prepare referral details and attach supporting evidence. | HOLD927 |

# Decision update and closure

## Update the claim decision

When the processor has completed the checks, update the claim decision in the legacy system. The decision must be consistent with the case notes and any CRM activity. If an agreement change is required, attach the change record before closure.

## Close the claim case

Before closing the case, check that all tasks have been completed, the decision has been recorded, any CRM contact has been linked to the case and any quality check outcome has been noted.

Has the case status changed to closed?

- **Yes**, return to the case list and check whether any related cases remain allocated to you.
- **No**, check whether the case is pending approval. If it is pending approval, no further action is required until the quality check has been completed.
`

module.exports = v4SampleDocument
