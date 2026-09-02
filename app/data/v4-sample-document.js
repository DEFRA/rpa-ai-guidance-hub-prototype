//
// A longer converted-guidance example for v4's read-only viewer, with images.
// Standalone from app/data/sample-document.js (which the quality checks and
// editors elsewhere are tuned against) so it can grow without disturbing
// them. Images point at the SVGs in app/assets/images, served at
// /public/images.
//

const v4SampleDocument = `# Check an application for the Sustainable Farming Incentive

As a case worker, you need to check whether an application is complete and correct, so that the claim can move to the next stage without avoidable delay.

This guide covers the whole check, from opening a case to recording the outcome. Work through it in order the first time, and use the contents to jump back to a step later.

![The application check workflow, from work queue to recorded outcome](/public/images/sfi-workflow.svg)

## Before you start

You need access to the case management system and the Rural Payments Agency (RPA) land register. Have the customer's agreement reference to hand.

- Check you are assigned to the case before you open it.
- If another case worker has it open, pick a different case from the queue.
- If the customer has an open query, resolve or note it before you begin.

## Steps

1. Open the case from the work queue.
2. Check the customer details and update the record if anything has changed.
3. Compare the land parcel numbers against the mapping service. If the parcels do not match the ones held on the customer record, make a note of the difference and refer the case to the mapping team for a decision.
4. Review the evidence against the checklist.
5. Record the outcome as appropriate.

Do not approve a claim while any of these steps is incomplete. A partial check is worse than none, because it looks finished to the next person who opens the case.

## Checking the evidence

The customer must supply evidence for each option they have applied for. Check the following:

- Open each attachment in turn.
- Confirm the date is within the agreement period.
- Record anything missing on the case notes.

![Evidence checklist showing attachments and dates confirmed](/public/images/evidence-checklist.svg)

If the evidence is incomplete, you should return the application to the customer with a note of exactly what is missing. Do not guess on the customer's behalf.

### What counts as evidence

Photographs, supplier invoices and, for some options, a completed capital works plan. A screenshot of a spreadsheet is not evidence on its own.

## Land parcel checks

Parcels are checked against the RPA land register. Where a parcel has changed since the last SFI agreement, the change must be recorded before the claim is approved, and the case worker should confirm with the mapping team that the new boundary has been accepted onto the register.

![Example land parcel map, with one boundary marked as changed](/public/images/parcel-map.svg)

A boundary shown with a dashed red line on the map has changed since the last agreement. Refer any changed boundary to the mapping team rather than accepting it yourself.

### Common issues

- A parcel number on the application that does not exist on the register — usually a typing error, but confirm rather than assume.
- A parcel split into two since the last agreement, so one number now covers two areas.
- Land that has moved out of the agreement holding entirely.

## Payments

Payment is made once the check is complete and the outcome recorded. Rates are set per option and published in the options list, and are reviewed each year.

- A claim referred to the mapping team is not paid until the referral is resolved.
- A returned application is not paid until the customer resubmits and it passes the check.

## Notes

Warning: do not approve a claim where evidence is missing, even where everything else is in order.

Contact the mapping team if you are not sure whether a parcel is eligible. It is always quicker to ask than to reverse an approval.
`

module.exports = v4SampleDocument
