# SkillSpace Direct Client-to-Creator Payment Tracking

## Payment model
- SkillSpace does not collect, hold, process, or transfer client funds.
- Client pays the assigned creator directly by UPI or bank transfer.
- Platform commission is 0%.
- Client approval of a milestone creates an `AWAITING_PAYMENT` tracking record for milestones with an amount greater than zero.
- Client submits the payment method, UTR/reference, payment date, and optional note.
- Creator must independently check their bank/UPI account and confirm actual receipt.
- Only after creator confirmation does the payment become `CREATOR_CONFIRMED` and the two acknowledgement/receipt documents become available.
- The documents are platform-generated acknowledgements, not GST tax invoices or bank settlement evidence.

## Creator setup
1. Open My Projects.
2. Add a preferred UPI ID or bank details in Private payment details.
3. Save. These details are not included in public creator profiles; they are returned only to the client and creator on their own project.

## Client workflow
1. Approve a milestone after reviewing the creator submission.
2. Open the Direct milestone payments section in that project.
3. Use the creator's saved UPI/bank details to pay directly outside SkillSpace.
4. Submit payment method, UTR/reference and payment date.
5. Wait for the creator to confirm receipt.

## Creator workflow
1. Check the bank/UPI account independently after client proof submission.
2. Select “I received this payment” only after funds are actually credited.
3. If details do not match, use “Report a problem”.

## API endpoints
- `GET /api/payments/method` — creator reads their private payment details.
- `PUT /api/payments/method` — creator saves/updates private UPI or bank details.
- `GET /api/payments` — authenticated user's payment history.
- `POST /api/payments/:id/proof` — assigned client submits direct-transfer details.
- `POST /api/payments/:id/confirm` — assigned creator confirms actual receipt.
- `POST /api/payments/:id/dispute` — either project party reports a payment issue.
- `GET /api/payments/:id/document?type=client|creator` — owner-only HTML acknowledgement/receipt, printable or saveable as PDF.

## Database
Additive SQLite tables: `creator_payment_methods`, `milestone_payments`, and `payment_documents`. Existing tables and rows are not dropped or recreated. Migration runs idempotently at server startup.

## Limitations / compliance
- UTR and creator confirmation are user-submitted assertions; SkillSpace does not independently verify bank settlement.
- No payment gateway, UPI collect request, escrow, automatic payout, refund, or chargeback functionality is implemented.
- A dispute is recorded for the parties to resolve; SkillSpace does not adjudicate or reverse transfers.
- Generated records are not GST tax invoices. Creator remains responsible for issuing the appropriate service invoice/receipt, as applicable.
- Before launch, obtain CA/legal advice on Section 194-O, GST/TCS, PAN/KYC, creator agreements and applicable e-commerce operator obligations. Direct settlement does not by itself remove statutory obligations.
