## Introduction

### Introduction

This guide covers the SITI Agri processing of Domestic CS Revenue Payment Claims (Higher Tier and Mid-Tier CS schemes) to be able to make a 'Final Payment'.

This guide should be followed where the claim is at 'In correction' status and is going to transition straight to 'Signoff Check'.

A claim can be 'Rejected' or 'Withdrawn' at any time in the process, provided no payment has been made. Details on when a rejection or withdrawal may be appropriate are covered in the guide {{LINK:Reject or withdraw a CS Revenue claim}}.

### Working restrictions

Note: You cannot work a CS Revenue Final Payment claim if there is an open Transfer case with one of the following case types: CS – Transfer Notification Received, CS – Transferor Amendment Created, CS – Transferee Amendment Created. Ask your Team Leader to mark the SBI as 'unworkable'. No further action can be taken on the claim until the Transfer case has been closed.

You will not be able to work the CS Revenue Final Payment claim if there is an open 'CS Agreement - Early Closure' case for the claim year you are working. Ask your team leader to mark the SBI as 'unworkable' and follow the {{LINK:Early Closure Guide}} for further steps.

If you identify an issue when working through the guidance that cannot be resolved by immediate colleagues or your Line Manager, refer to the {{LINK:Issue Resolution Route Guide}} for next steps.

### Claimed amounts

The claim payment process is based upon what the claimant has 'Declared' on their revenue claim. Do not change on their behalf.

If there is a reason/issue that means that we cannot pay for what has been claimed (for example due to incompatibility, absence, or ineligibility), then this must be considered as a breach. The reduction is applied at the 'In checking' stage of the claim process.

If you need to apply either an over delivery, overstated, eligibility or over declaration reduction, details are provided within the {{LINK:CS Revenue Claim - Reductions Guide and How to Apply Them}}.

If you need to apply a 'prescription breach' reduction, details are provided within the {{LINK:CS Breaches and Reductions under Control for claims}} guide.

## Transitions

### Received to In checking

Upon completion of Data Alignment activity, claims are bulk transitioned from 'Received' to 'In checking'.

### Auto-population of claim data

Upon certain transitions, the system auto populates the claim form questions 'in the positive' so that this manual activity is no longer required. The claim progresses unless there are any 'blocking' non-closed cases in Case Management or system action is required.

Auto population of a claim's verified values with declared values happens on the transition from 'Received' to 'In checking'. This populates the 'Y'/'N' radio button with a 'Y'.

### In checking to Ready for sign off

A bulk transition attempts to move claims from 'In checking' to 'Ready for sign off' allowing the scheme rules to run. Where these rules fail, case managements may be generated for investigation, and the claim status is set at 'In correction'.

### In correction to Ready for sign off

Once all case activity is complete, the claim transition from 'In correction' to 'Ready for sign off' can be attempted, allowing the claim to be paid.

## Case Creation Principles

### Overview [heading: Case Creation Principles]

To ensure consistent and effective handling of customer contact, all CRM cases must now follow a streamlined approach. This replaces the previous method of creating one case per claim per scheme year, which often remained open after payment.

Now, each case will represent a single, distinct issue requiring customer contact. This allows for clearer tracking, faster resolution, and improved customer service.

Any case you create will remain under your ownership as part of the <CS Claim Revenue> Queue. Follow up contact with the customer will require using child cases.

### Creating a New Case

To create a 'New Case', you must first navigate to the customer's Organisation account screen. You can access this from the dashboard by searching for the business using their SBI number — enter an SBI or Organisation name in the search box and press Enter.

You can view open cases from the 'Recent Cases' section within the Organisation account. As the sub grid only shows cases from the last year, to view a list of all cases click the three dots, then click 'See associated records'.

[[BRANCH:new-case-resolved-check]]

From the ribbon at the top of the page click '+New Case'. Complete all mandatory fields marked with a red asterisk that have not been auto populated, including 'CASE MAPPING' > 'Scheme' (select CS), then the 'Subject' field once it appears.

Under 'CASE DETAILS', enter the Case Title in the format [SBI][Title][Relevant Scheme Year][Agreement reference/Claim ID], for example: 12345678 ED1 Evidence Required 2024 2000000. Also complete 'Case Origin' and 'Case Description'.

Under 'ORGANISATION DETAILS', 'Organisation' should auto populate. Under 'CONTACT DETAILS', enter the contact's name — the rest of the contact information (Email, Mobile Phone, etc.) will auto populate.

Click 'Save'. If a 'Business Process Error' message appears, check you have the correct Scheme and Subject combination and try again. If saved successfully, continue to Resolving the Case.

### Resolving the Case

When a customer's queries have been answered, cases should be resolved. Cases with no open activities should also be resolved.

To resolve the case, from the top banner click 'Resolve Case'. Complete the required fields marked with a red asterisk: select a Resolution Type from the drop-down list, enter a summary in Resolution, then click Save & Close.

Note: All activities within a case must be closed before you can resolve it — you'll receive a warning if you attempt to close a case with open activities. Any auto-notification activity can be closed; all other activities should be investigated first.

### Child Cases

If a case has been resolved but follow-up communication with the customer is required, open the resolved case in CRM from the Recent Cases tab and click the Create Child Case icon.

Use the previous case title and add that this is a follow-up, for example: 12345678 ED1 Evidence Required Follow-up 01 2024 2000000, then Follow-up 02 for a second follow-up, and so on.

For further guidance on Child Cases, see the section on creating a Parent-Child relationship (linking cases) in the {{LINK:CRM Basic Functions Guidance}}.

## Case Management

### Early closure cases

Note: Early closure cases need to be worked for the claim year you are working. Use the {{LINK:Early Closure Guide}} to assist you.

An open 'CS agreement early closure' case with the same scheme year as the claim you are working will cause the transition to sign off to fail, regardless of whether it relates to that particular agreement or not. Check the case notes, details, and correspondence on CRM to determine which agreement ID the closure relates to.

If the early closure case IS relevant to the agreement of the claim you are working, follow the {{LINK:Early Closure Guide}}. The claim for the current claim year will need to be withdrawn before payment is made, as closure processing recovers any completed payments made on the agreement anyway.

If the early closure case is NOT relevant to the agreement of the claim you are working: put the early closure case management to 'Pending for approval' status, move the unaffected claim to sign off, then immediately click the 'red hand' icon to set the case status back to in progress and replace any hold if one was in place.

You may also encounter a claim failing the open cases check due to a 'CS agreement – final closure' case — these only relate to capital-only agreements and are not relevant to revenue claims. Use the same process as above.

### Preparing to transition

All holds must be resolved prior to the claim being transitioned. Before continuing, search CRM for any correspondence that may impact the CS claim and help complete any case managements raised — refer to section 2.1 'Accessing CRM' of the {{LINK:CRM Basic Navigation and Admin}} guide.

After attempting to transition to 'Ready for sign off', if the system changes the claim to 'In correction', you will need to transition the claim once more to open and complete the screen. In the transition drop-down, click RE-VERIFICATION, then the footprint icon, then 'Move'.

Note: Before working through the case managements below, check for a 'Suspected Customer Fraud' or 'Fraud Referral under review' case. If found, refer to the {{LINK:Suspected Fraud Cases guide}} for the checks required.

### Case types to work through

The cases below are separated into subcategories shown in a recommended working order, to help avoid duplicate work or issues appearing in later cases. There is no specific order to work through cases within the same subgroup:

- CS Agreement - Early Closure — continue to the Early Closure Guide.
- CS Agreement Parcel may have been amended — bulk closure case; close with note: 'Bulk closure case, closed as per Processing to Final Payment Guidance instruction.' If status changes to 'Pending for approval', notify your Team Leader for case closure.
- CS Agreement Parcel has been amended
- CS Claim Agreement Amendment in progress
- CS Transfer Notification Received — put all Revenue cases you're working 'on hold' in SITI Agri. Add a case note starting with 'HOLD711 – Transfer in progress'.
- CS Transferor Amendment Created
- CS Transferee Amendment Created
- BUSINESS STRUCTURE IACS26/27 – PAYMENT HELD — raised by the CCM team during a business change assessment; won't stop the claim transitioning but holds payment. The CCM team closes these cases.
- CS Revenue Payment Claim - Amendment in Progress — worked and closed by the amendments team.
- CS Revenue Payment Claim - Agreement Amendment Required Following Final Claim Payment — for future year impacted claims.
- CS Commons - Parcel Addition to the Common Agreement — continue to the CS Commons - Parcel Addition to the Commons Agreement guide.

Once you see the 'End of Process' text in the sub-guide you're working, return to this point to work any outstanding cases, or continue to Check verification.
