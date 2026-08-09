//
// The markdown a Word document turns into, used by the quality issues pages and
// the editor so they are all looking at the same document.
//
// Written as a task-based operational guide, the shape the authoring
// requirements ask for — and with the faults those requirements exist to catch:
// an incomplete purpose statement, no "Before you start", steps that do not
// open with an action, a compound step, a decision point that does not use
// IF/THEN/NEXT STEP, an unexplained acronym, ambiguous wording, an over-long
// sentence, an image with no alt text and actions in a bulleted list.
//

module.exports = `# Check an application for the Sustainable Farming Incentive

As a case worker
You need to check whether an application is complete
So that the claim can move to the next stage

## Steps

1. The case should be opened from the work queue.
2. Check the customer details and update the record.
3. Compare the land parcel numbers against the mapping service, and if the parcels do not match the ones held on the customer record you will need to make a note of the difference and refer the case to the mapping team for a decision.
4. Evidence is reviewed against the checklist.
5. Record the outcome as appropriate.

![](work-queue-screenshot.png)

## Checking the evidence

The customer must supply evidence for each option they have applied for. Check the following:

- Open each attachment in turn.
- Confirm the date is within the agreement period.
- Record anything missing on the case notes.

If the evidence is incomplete you should return the application to the customer.

## Land parcel checks

Parcels are checked against the Rural Payments Agency (RPA) land register. Where a parcel has changed since the last SFI agreement, the change must be recorded before the claim is approved, and the case worker should confirm with the mapping team that the new boundary has been accepted onto the register.

![Map showing the land parcel boundary](parcel-boundary.png)

## Notes

Warning: Do not approve a claim where evidence is missing.

Contact the mapping team if you are not sure whether a parcel is eligible.
`
