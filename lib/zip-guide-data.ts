export interface QuickRefRow {
  task: string
  whereTo: string
  tabLink?: string      // tab id to navigate to within the guide
  sectionLink?: string  // section id to scroll to after switching tab
}

export interface GuideImage {
  file: string
  caption?: string
  size?: 'small' | 'medium' | 'full'  // default: full
}

export interface Section {
  id: string
  title: string
  level: 1 | 2 | 3
  content: string
  contentAfter?: string   // rendered after the first image (remaining images follow)
  images?: GuideImage[]
  hideTitle?: boolean     // suppress auto-rendered title (heading lives in content instead)
}

export interface Guide {
  id: string
  title: string
  subtitle: string
  description: string
  quickReference: QuickRefRow[]
  tableOfContents: string[]
  sections: Section[]
}

// ─── ZIP PO Request Employee Guide ───────────────────────────────────────────

const poGuide: Guide = {
  id: 'po-request',
  title: 'ZIP PO Request',
  subtitle: 'Employee Reference Guide',
  description:
    'Walks you through the process of submitting a purchase request in Zip — from initiating the request and completing the questionnaire to uploading supporting documents and obtaining approvals.',
  quickReference: [
    { task: 'How to access ZIP?', whereTo: 'Zip web application → Okta Login → Zip Home → + New Request', tabLink: 'initiating', sectionLink: 'initiating' },
    { task: 'Start a new purchase request', whereTo: 'Home screen → + New request → Request a Purchase', tabLink: 'initiating', sectionLink: 'initiating' },
    { task: 'Submit on behalf of another employee', whereTo: 'Question 1 — Who is the requester?', tabLink: 'questionnaire', sectionLink: 'q1-requester' },
    { task: 'Check for existing software licenses', whereTo: 'Current Software List', tabLink: 'questionnaire', sectionLink: 'q4-category' },
    { task: 'Request an NDA with a new vendor', whereTo: 'IT & Security Information → Question 1 → Request an NDA Workflow in DocuSign', tabLink: 'it-security', sectionLink: 'it-security' },
    { task: 'Add a new vendor', whereTo: 'Question 7 — Choose the vendor → + Add as a new vendor', tabLink: 'questionnaire', sectionLink: 'q7-vendor' },
    { task: 'Add items to purchase', whereTo: 'Question 9 — Please enter the line item breakdown', tabLink: 'questionnaire', sectionLink: 'q9-line-items' },
    { task: 'Look up account codes for line items', whereTo: 'Contact the Accounting team' },
    { task: 'Check payment terms', whereTo: 'Default is Net 60 — see Question 18', tabLink: 'questionnaire', sectionLink: 'q18-payment-terms' },
    { task: 'Track your request after submission', whereTo: 'No PO = No Pay — see Question 19', tabLink: 'questionnaire', sectionLink: 'q19-payment-method' },
    { task: 'Check payment method policy', whereTo: 'Home screen → My requests' },
  ],
  tableOfContents: [
    '01. Initiating a Purchase Request',
    '02. Purchase Request Questionnaire',
    '03. NDA',
    '04. Uploading Documents or Supporting Files',
  ],
  sections: [
    {
      id: 'initiating',
      title: 'Initiating a Purchase Request',
      level: 1,
      content: `## How to Start a Purchase Request

**What is a Purchase Request?** A purchase request is a formal request submitted in Zip by an employee to initiate the purchase of goods or services from a vendor. Once approved, Zip automatically generates a purchase order (PO).

**When is it Required?** A purchase request is required any time an employee needs to procure goods or services on behalf of FluidStack. In line with FluidStack's **No PO, No Pay** policy, a purchase request must be approved before a vendor invoice can be processed for payment.

**Who is Responsible?** The employee requesting the goods or services is responsible for submitting the purchase request in Zip. The Finance & Accounting team is responsible for the downstream AP processing of approved requests.

---

**Step 1: Access Zip and Start a New Request**

- Log in to Zip at FluidStack's Zip instance
- From the Home screen, click the **+ New request** button in the top-right corner to begin a purchase request

[IMAGE]

---

**Step 2: Select the Request Type**

- After clicking + New request, a list of request forms will appear. Select **Request a Purchase** to initiate a purchase request.

> **Note:** You will also see a **PO Change Order** option — this is for modifying an existing purchase order, not for new purchases.

[IMAGE]`,
      images: [
        { file: 'po-02-65c4926e.png', caption: 'Step 1 — Click + New request on the Home screen' },
        { file: 'po-03-c6afe257.png', caption: 'Step 2 — Select Request a Purchase from the list' },
      ],
      contentAfter: `**Step 3: Complete the Purchase Request Form**

After selecting Request a Purchase, you will be taken to a multi-section questionnaire. The form is organized into three sections, visible in the left-hand navigation:

- [General Information](#general-information) — Basic request details, vendor, coding
- [IT & Security Information](#it-security) — Security questionnaire and NDA
- [Documents](#documents) — Supporting files and attachments

We will walk through each section and every question in detail in the steps that follow. Use the **Purchase Request Questionnaire** tab above for the full step-by-step walkthrough.`,
    },
    {
      id: 'questionnaire',
      title: 'Purchase Request Questionnaire',
      level: 1,
      content: `This section walks through every question in the purchase request form. The form is organized into three sections: **General Information**, **IT & Security Information**, and **Documents**. Complete all fields carefully — this information drives approval routing and will appear on all Zip notifications.`,
    },
    {
      id: 'general-information',
      title: 'General Information',
      level: 2,
      content: `The General Information section captures the foundational details of your purchase request — who is requesting it, what is being purchased, from whom, and how it should be coded organizationally. Every field in this section is required. Complete all fields carefully, as this information will appear on all Zip notifications and drive the approval routing for your request.`,
    },
    {
      id: 'q1-requester',
      title: 'Question 1 — Who is the requester?',
      level: 3,
      content: `This field will default to your own name and FluidStack email address. You can submit a request on behalf of another employee by searching for and selecting their name in the dropdown. If you submit on behalf of someone else, you will automatically be added as a **follower** on the request, meaning you will receive notifications and can monitor its progress without being the primary requester.`,
      images: [{ file: 'po-04-4c829ec0.png', caption: 'Question 1 — Who is the requester?' }],
    },
    {
      id: 'q2-location',
      title: 'Question 2 — Which location is this purchase for?',
      level: 3,
      content: `Select the FluidStack location this purchase is intended for. The dropdown includes all company sites across regions — for example, office locations such as NYC Office or ATX Office, as well as data center sites such as BUF1 [Lake Mariner] or SNK1 [Barber Lake].

> ⚠️ **Important:** Choose your location carefully. Your location selection will automatically populate the subsidiary field, or in some cases you will have the option to choose a subsidiary (Question 3), which is tied to the cost centers used for financial coding. Selecting the wrong location may result in the purchase being coded to the wrong entity or cost center.`,
    
      images: [
        { file: 'po-05-631d0302.png', caption: 'Question 2 — Which location is this purchase for?' },
      ],
    },
    {
      id: 'q3-subsidiary',
      title: 'Question 3 — What subsidiary is this purchase for?',
      level: 3,
      content: `This field will auto-populate based on the location you selected above. Verify that the subsidiary shown is correct before proceeding. If it does not look right, go back and confirm your location selection.`,
    
      images: [
        { file: 'po-06-83763d07.png', caption: 'Question 3 — What subsidiary is this purchase for?' },
      ],
    },
    {
      id: 'q4-category',
      title: 'Question 4 — What are you looking to purchase?',
      level: 3,
      content: `Select the category that best describes what you are purchasing. The available categories are:

- **Hardware - DC** — Data center hardware
- **Software** — Software licenses or subscriptions
- **Hardware - Employee** — Hardware for employee use (laptops, monitors, peripherals, etc.)
- **Tools** — Tools and equipment
- **Manufacturing** — Manufacturing-related purchases
- **Consulting, Staffing, and Professional Services** — External consultants, contractors, or professional service providers
- **Conferences and Training** — Event registrations, training courses, or certifications
- **Office Expenses and Supplies** — General office supplies and expenses
- **Gifts** — Business gifts
- **Employee Events** — Team events and activities
- **Swag** — Branded merchandise
- **LLE** — Leasehold or lease-related expenses
- **Other** — Anything that does not fit the categories above

> **Tip:** Selecting the correct category is important as it helps route your request to the right approvers and ensures accurate expense classification.

[IMAGE]

### Additional Guidance for Software Purchases

> ⚠️ **STOP — Software Purchases Only:** Before submitting a request for software, you must first review the **Current Software List** to check if FluidStack already has the tool you need or if an alternative is already in place. Only proceed with a new software request if nothing on the list meets your needs.

**Step 1 — Check for Similar or Existing Software Solutions**

Verify that FluidStack does not already have the same or a similar software license in place — duplicate or overlapping software licenses should be avoided.

[IMAGE]

**Step 2 — Select Software Category**

If you confirmed that no existing software meets your needs and selected "There is nothing that works for me, I want to submit a request for something new," you will then be prompted to select a software subcategory.

[IMAGE]

**Step 3 — New, Renewal or Trial/Proof of Concept (POC)**

Select the option that best describes the nature of this software purchase:

- **New** — Proceed directly to the vendor selection question
- **Renewal** — You are extending or renewing a product you currently use
- **Trial / Proof of Concept (PoC)** — A new product or service being evaluated for a temporary period, typically free or at a nominal cost

**Renewal:** Are there any new products or services being purchased? Select Yes if you are purchasing a new module or additional services that have not been approved before. Select No if you are simply buying more or less of the same thing that has already been approved.

[IMAGE]

**Trial/PoC:** Provide the name of the product or service being trialed in the follow-up field.

[IMAGE]`,
    
      images: [
        { file: 'po-07-c36f3dc4.png', caption: 'Question 4 — What are you looking to purchase?' },
        { file: 'po-08-9d1ff55e.png', caption: 'Software: Step 1 — Check for existing software' },
        { file: 'po-09-679aef3f.png', caption: 'Software: Step 2 — Select software category' },
        { file: 'po-10-93beb8d6.png', caption: 'Software: Renewal option' },
        { file: 'po-11-a281f6c1.png', caption: 'Software: Trial/PoC option' },
      ],
    },
    {
      id: 'q5-detailed-category',
      title: 'Question 5 — Please select the detailed category',
      level: 3,
      content: `After selecting a top-level purchase category, you will be prompted to choose a more specific subcategory. The options shown will vary depending on your selection in the previous question.

> **Note:** The subcategory options will be different for other top-level categories such as Hardware - DC, Software or Professional Services etc. Always select the option that most accurately reflects what is being purchased.`,
    
      images: [
        { file: 'po-12-e274978e.png', caption: 'Question 5 — Select the detailed category' },
      ],
    },
    {
      id: 'q6-product-name',
      title: 'Question 6 — What is the name of the product or service?',
      level: 3,
      content: `Enter a clear and descriptive name for the product or service you are purchasing. This will serve as the title of your request in Zip and will appear on all notifications sent to approvers.

**Example:** \`#375: Dell PowerStore 1200T 100TB FISH Storage\`

Aim to include key details such as the item number (if applicable), vendor product name, model, and a brief descriptor — all in a concise format.`,
    
      images: [
        { file: 'po-13-e8fcc390.png', caption: 'Question 6 — Name of the product or service' },
      ],
    },
    {
      id: 'q7-vendor',
      title: 'Question 7 — Choose the vendor you want',
      level: 3,
      content: `Search for and select the vendor you are purchasing from. Zip maintains a list of active, pre-approved vendors that already have contracts and pre-negotiated deals in place with FluidStack — using these vendors saves time and reduces costs.

If your vendor does not appear in the search results, click **+ Add as a new vendor** to add them. Note that new vendors may require additional review and approval before the request can proceed.

[IMAGE]

### Adding a New Vendor

You must provide a vendor contact for your request. This contact may be reached out to directly as part of the approval process. To add a contact, click **+ Add new contact** and complete the following fields:

- First name and Last name
- Email
- Country code and Phone number
- Contact title or role (e.g., Sales Manager)

Click **Save** when done.

> **Note:** At least one vendor contact must be added before you can proceed. Once added, the vendor will automatically receive an email with a questionnaire to begin the onboarding process on the Zip platform.

[IMAGE]

**Step 1** — Search for the vendor and click **+ Add as a new vendor** if not found.

[IMAGE]

**Step 2** — Fill in the vendor details and click **Save**.

[IMAGE]

**Step 3** — Add a vendor contact by clicking **+ Add new contact**, completing all fields, and clicking **Save**.

[IMAGE]`,
    
      images: [
        { file: 'po-14-763450c5.png', caption: 'Question 7 — Choose the vendor' },
        { file: 'po-15-1c5e6564.png', caption: 'Vendor contact selection' },
        { file: 'po-16-32f131a3.png', caption: 'Adding New Vendor — Step 1' },
        { file: 'po-17-e54a9940.png', caption: 'Adding New Vendor — Step 2' },
        { file: 'po-18-6c2da451.png', caption: 'Adding New Vendor — Step 3: Add vendor contact' },
      ],
    },
    {
      id: 'q8-department',
      title: 'Question 8 — What department is this purchase for?',
      level: 3,
      content: `Select the department that this purchase should be attributed to. The dropdown is organized by functional area and covers all FluidStack departments and sub-departments across General & Administrative, Cost of Revenue, and Technology & Infrastructure.

> **Tip:** If you are unsure which department to select, check with your manager or the budget owner for this purchase before submitting.`,
    
      images: [
        { file: 'po-19-cbdcc3f0.png', caption: 'Question 8 — What department is this purchase for?' },
      ],
    },
    {
      id: 'q9-line-items',
      title: 'Question 9 — Please enter the line item breakdown',
      level: 3,
      content: `Line items form the backbone of your purchase request — this is how the purchase order will be issued and how the vendor invoice will be matched automatically in Zip. Add as many line items as needed by clicking **+ Add line item**. Always include a separate line for estimated shipping and a separate line for estimated tax. For any discounts or promotions, enter a negative amount.`,
      contentAfter: `Each line item requires the following:

**a) Line Description**
Enter a clear description of the item or service (e.g., "Tailor Made PowerStore 1200T", "Shipping", "Sales Tax").

**b) Line Type**
Select either **Item** or **Expense**:
- Use **Item** for physical products that are shipped and tracked by quantity (e.g., servers, hardware)
- Use **Expense** for services and other charges such as shipping, installation, or sales tax

**c) Quantity and Amount**
Enter the quantity of units being ordered and the unit amount. Zip will calculate the line total automatically. If the exact amount is not yet known, enter your best estimate.

**d) Amount**
Enter the dollar amount for the line item. If the exact amount is not yet known, enter your best estimate.

**e) Code**
Select the appropriate account code from the chart of accounts. This determines how the purchase is classified in the general ledger (e.g., 15040 Servers & Switches, 60660 Postage, Freight, Courier, Sales Taxes Payable TX). If you are unsure which code to use, reach out to the **Accounting team** before submitting.

**f) Item Account**
This field applies to purchases that will be capitalized as assets on FluidStack's books (e.g., servers and switches). If you are purchasing a physical asset owned by FluidStack, select the appropriate asset account (e.g., FA - Servers & Switches). This field is not required for expense-type line items.

**g) Department**
Select your department or the department you are ordering on behalf of (e.g., Technology & Infrastructure : Data Centers).

**h) FluidStack Location**
Select the same location you entered in Question 2.

Click **Save** on each line item before adding the next one.

**Example:** A hardware purchase may have three lines — one for the equipment itself (Line Type: Item), one for estimated shipping (Line Type: Expense), and one for estimated sales tax (Line Type: Expense), each coded and tagged to the appropriate department and location.

Once all line items are saved, Zip will display a summary showing each line and its total, along with the overall Line Item Total. You can edit, duplicate, or delete any line item at any time using the icons on the right before submitting the request.`,

      images: [
        { file: 'po-20-36d33516.png', caption: 'Question 9 — Line item breakdown: Step 1' },
        { file: 'po-21-8cdb8059.png', caption: 'Question 9 — Step 2: Hardware example' },
        { file: 'po-22-8a853149.png', caption: 'Question 9 — Step 3: Line item summary' },
      ],
    },
    {
      id: 'q10-total-cost',
      title: 'Question 10 — How much does this cost?',
      level: 3,
      content: `This field represents the total estimated contract value and will **auto-populate** based on the line items you entered in the previous step. You do not need to manually enter this amount — it is driven directly by your line item breakdown.

> **Note:** If you need to change this amount, update or delete the relevant line items rather than editing this field directly.`,
    
      images: [
        { file: 'po-23-419f6e66.png', caption: 'Question 10 — Total cost (auto-populated)' },
      ],
    },
    {
      id: 'q11-passthrough',
      title: 'Question 11 — Is this a Passthrough Expense to Atlas?',
      level: 3,
      content: `Atlas is the internal code name for Anthropic. Select **Yes** if this purchase is related to Anthropic and the costs can be passed through to them. Select **No** if the costs cannot be passed through. If you are unsure, check with your manager before proceeding.`,
    
      images: [
        { file: 'po-24-2ef7e1eb.png', caption: 'Question 11 — Passthrough Expense to Atlas?' },
      ],
    },
    {
      id: 'q12-layman',
      title: 'Question 12 — In layman\'s terms, what are we purchasing?',
      level: 3,
      content: `Provide a plain-language description of what is being purchased. Avoid technical jargon — write this as if explaining it to someone outside your team. Bullet points are acceptable.`,
    
      images: [
        { file: 'po-25-2aa0575a.png', caption: "Question 12 — In layman's terms, what are we purchasing?" },
      ],
    },
    {
      id: 'q13-business-value',
      title: 'Question 13 — How does this purchase move our business forward?',
      level: 3,
      content: `Explain the business value or strategic benefit of this purchase. Describe how it supports FluidStack's operations or goals. Bullet points are acceptable.`,
    
      images: [
        { file: 'po-26-0ac1550c.png', caption: 'Question 13 — How does this purchase move our business forward?' },
      ],
    },
    {
      id: 'q14-business-critical',
      title: 'Question 14 — Is this business critical?',
      level: 3,
      content: `Describe the urgency and necessity of this purchase. Explain what operational or business impact would occur if this purchase is not approved. Bullet points are acceptable.`,
    
      images: [
        { file: 'po-27-5764c707.png', caption: 'Question 14 — Is this business critical?' },
      ],
    },
    {
      id: 'q15-16-dates',
      title: 'Questions 15 & 16 — Contract Start and End Dates',
      level: 3,
      content: `Enter the start date of the contract or purchase agreement. If the purchase has a defined end date, enter that as well — otherwise, the end date field is optional and can be left blank for one-time purchases.`,
    
      images: [
        { file: 'po-28-5a53f5b8.png', caption: 'Questions 15 & 16 — Contract start and end dates' },
      ],
    },
    {
      id: 'q17-payment-frequency',
      title: 'Question 17 — What is the payment frequency?',
      level: 3,
      content: `Select how often payments will be made for this purchase. For example, a one-time hardware purchase would be a one-time payment, while a software subscription may be monthly or annual. This information is important for planning and budgeting purposes, so if you are unsure, check with your manager before selecting.`,
    
      images: [
        { file: 'po-29-96b4bdfb.png', caption: 'Question 17 — Payment frequency' },
      ],
    },
    {
      id: 'q18-payment-terms',
      title: 'Question 18 — What are the payment terms?',
      level: 3,
      content: `Select the payment terms agreed upon with the vendor. FluidStack's standard payment terms are **Net 60** — this should be your default selection. If Net 60 is not possible, the minimum acceptable terms are **Net 30**. If you are selecting anything other than Net 60, ensure you have discussed this with your manager prior to submitting.`,
    
      images: [
        { file: 'po-30-f6961e84.png', caption: 'Question 18 — Payment terms (default Net 60)' },
      ],
    },
    {
      id: 'q19-payment-method',
      title: 'Question 19 — What is the payment method?',
      level: 3,
      content: `Select **Purchase Order** as the payment method. This is FluidStack's standard policy — **No PO = No Pay**. All invoices must have an approved Purchase Order before payment can be processed.

A Virtual Card should only be used in rare circumstances where a software purchase cannot be completed without one. For all other purchases and services, a Purchase Order is required.`,
    
      images: [
        { file: 'po-31-963a881a.png', caption: 'Question 19 — Payment method (Purchase Order)' },
      ],
    },
    {
      id: 'q20-delivery-date',
      title: 'Question 20 — What is the desired delivery date?',
      level: 3,
      content: `Enter the date by which you need the purchase to be delivered. This helps the procurement and operations teams plan accordingly. If the item is not being shipped, choose any date.`,
    
      images: [
        { file: 'po-32-8d751861.png', caption: 'Question 20 — Desired delivery date' },
      ],
    },
    {
      id: 'q21-shipping',
      title: 'Question 21 — Will this purchase need shipping?',
      level: 3,
      content: `Select **Yes** if the purchase requires physical shipment. Select **No** for services, software, or any purchase that does not require delivery of a physical item.`,
    
      images: [
        { file: 'po-33-7bcc1b91.png', caption: 'Question 21 — Will this purchase need shipping?' },
      ],
    },
    {
      id: 'q22-ship-to',
      title: 'Question 22 — What is the ship to address?',
      level: 3,
      content: `Select the address where the purchase should be delivered. If the purchase does not require shipment, select the address of the entity making the purchase. Ensure the address you select agrees with the location chosen in Question 2.`,
    
      images: [
        { file: 'po-34-34dbc605.png', caption: 'Question 22 — Ship to address' },
      ],
    },
    {
      id: 'q23-special-instructions',
      title: 'Question 23 — Are there any Special Instructions? (Optional)',
      level: 3,
      content: `This is an optional field. Use it to include any specific instructions or notes that should appear on the purchase order — for example, delivery instructions, installation requirements, or any other details the vendor should be aware of.`,
    
      images: [
        { file: 'po-35-1289d9a8.png', caption: 'Question 23 — Special instructions (optional)' },
      ],
    },
    {
      id: 'it-security',
      title: 'IT & Security Information',
      level: 1,
      content: `This section captures information related to data security, compliance, and vendor risk. It ensures that all vendors meet FluidStack's security and legal requirements before a purchase is approved. Complete all fields carefully and escalate to the IT or Legal team if you are unsure of any answers.

### Question 1 — Do we have a signed NDA with this vendor?

Select **Yes** if a Non-Disclosure Agreement is already in place with this vendor. Select **No** if one does not exist, or **I don't know** if you are unsure.

If you selected No or I don't know, you will be prompted to submit an NDA request through DocuSign before proceeding. Click the **Request an NDA Workflow in DocuSign** link and acknowledge by selecting "Okay, I will do this."`,
    
      images: [
        { file: 'po-36-883554a1.png', caption: 'IT & Security — Question 1: Signed NDA with vendor?' },
      ],
    },
    {
      id: 'nda',
      title: 'NDA',
      level: 1,
      content: `If a signed NDA does not exist with the vendor, you must submit an NDA request through DocuSign before the purchase request can proceed. Click the **Request an NDA Workflow in DocuSign** link in the IT & Security Information section and follow the prompts to initiate the NDA process.`,
    },
    {
      id: 'documents',
      title: 'Documents — Uploading Supporting Files',
      level: 1,
      content: `If you have any supporting documents related to this vendor — such as an existing NDA, security questionnaire responses, or vendor certifications — upload them here. You can drag and drop files into the upload area or click **"click to upload a new file"** to browse and select files from your device.

### Question 1 — Please attach any files for reference

Upload any relevant supporting documents for this purchase request in this section.`,
    
      images: [
        { file: 'po-37-cb948972.png', caption: 'Documents — Attach supporting files' },
      ],
    },
  ],
}

// ─── ZIP AP Processing Employee Guide ────────────────────────────────────────

const apGuide: Guide = {
  id: 'ap-processing',
  title: 'ZIP AP Processing',
  subtitle: 'Employee Reference Guide',
  description:
    'Walks you through the process of reviewing and processing vendor invoices in Zip — from receiving and matching invoices to approved POs, coding expenses, and syncing approved payments to NetSuite for final disbursement.',
  quickReference: [
    { task: 'Access AP Invoice Queue', whereTo: 'Pay → Inbox (ZIP Dashboard)', tabLink: 'accessing-zip', sectionLink: 'accessing-zip' },
    { task: 'Forward Vendor Invoice to Zip', whereTo: 'Email to fluidstack@invoice.ziphq.com', tabLink: 'accessing-zip', sectionLink: 'accessing-zip' },
    { task: 'Review Prior Vendor Invoices', whereTo: 'AP Invoice Processing Overview → Step 3: Processing the AP Invoice — Coding', tabLink: 'ap-overview', sectionLink: 'ap-overview-step3' },
    { task: 'Add / Update Payment Method', whereTo: 'Invoice Detail → Payment Method → Pencil Icon', tabLink: 'vendor-payment', sectionLink: 'adding-new-payment-method' },
    { task: 'Adding a vendor', whereTo: 'How to add a new vendor into NetSuite', tabLink: 'appendix', sectionLink: 'appendix' },
    { task: 'Link or Verify a PO', whereTo: 'Invoice Detail → PO Field → Match or Pencil Icon', tabLink: 'po-matching', sectionLink: 'po-matching' },
    { task: 'Look Up FluidStack Location from PO', whereTo: 'Invoice Detail → Click PO Link → Purchase Terms', tabLink: 'po-matching', sectionLink: 'po-matching' },
    { task: 'Code GL Account', whereTo: 'Invoice Detail → Line Items → Account Field', tabLink: 'line-items', sectionLink: 'line-items' },
    { task: 'Add Tax/Shipping as Separate Line Item', whereTo: 'Line Items → + Add Line → Set Matched PO Line to Not Matched', tabLink: 'line-items', sectionLink: 'line-items' },
    { task: 'Apply Amortization (SaaS/Rent)', whereTo: 'Line Items → Amortization Schedule → Select PPD IT Software / PPD Rent etc.', tabLink: 'line-items', sectionLink: 'line-items' },
    { task: 'Verify Invoice Totals', whereTo: 'Invoice Totals Section', tabLink: 'totals-create-bill', sectionLink: 'invoice-totals' },
    { task: 'Create Bill', whereTo: 'Once all data is complete, click Create Bill in the top right-hand corner of the Invoice Detail screen', tabLink: 'totals-create-bill', sectionLink: 'create-bill' },
  ],
  tableOfContents: [
    '01. Accessing Zip for AP Processing',
    '02. AP Invoice Processing Overview',
    '   • Vendor and Payment Method Verification',
    '   • Purchase Order Matching and Verification',
    '   • Invoice Detail Review',
    '   • Line Item Section & Accounting',
    '   • Invoice Totals Section',
    '03. Appendix',
  ],
  sections: [
    {
      id: 'accessing-zip',
      title: 'Accessing Zip for AP Processing',
      level: 1,
      content: `## How to Access the AP Invoice Queue

1. **Log In to Zip** — Access [https://app.ziphq.com](https://app.ziphq.com) using FluidStack SSO credentials via Okta authentication.
2. **Navigate to the AP Inbox** — From the Zip dashboard, go to **Pay → Inbox** to access the AP Invoice Queue. This is where all unprocessed vendor invoices awaiting review will appear.

[IMAGE]

> **[A]** **Due Date** — The date the invoice payment is due to the vendor. This column is used to sort and prioritize invoices in the queue.

The inbox shows all unprocessed invoices. Click any row to open the invoice detail screen and begin processing.

[IMAGE]

**Forwarding Invoices to Zip**

Vendors can submit invoices directly to Zip by emailing them to **fluidstack@invoice.ziphq.com**. Invoices received this way will automatically appear in the AP inbox.`,
    
      images: [
        { file: 'ap-02-092ebd8c.png', caption: 'ZIP AP Dashboard — left-hand sidebar navigation' },
        { file: 'ap-03-98b6340d.png', caption: 'AP Invoice Queue — search and filter options' },
      ],
    },
    {
      id: 'ap-overview',
      title: 'AP Invoice Processing Overview',
      level: 1,
      content: `This section walks you through the steps required to review, code, and process vendor invoices in Zip. Once an invoice appears in the Pay Inbox, the AP processor is responsible for verifying invoice details, assigning the appropriate GL accounts and cost centers, and routing the invoice for approval before it is synced to NetSuite for payment.`,
      images: [],
    },
    {
      id: 'ap-overview-step1',
      title: 'Step 1: Select an Invoice from the Inbox',
      level: 1,
      hideTitle: true,
      content: `### Step 1: Select an Invoice from the Inbox

[SCOPE]

From the **Inbox**, you will see a list of all unprocessed invoices displaying key details including Invoice Date, Due Date, Invoice #, Vendor, Amount, Assignee, and Received On date. **Click on the invoice** you want to process to open it. You can also use the search bar to look up a specific invoice by vendor name or invoice number, or use the filters (Duplicates, Amount, Invoice Date, Source) to narrow down the list.

Sort by "**due date**" and **prioritize the earliest date**. If invoices are up to date, prioritize by dollar balance.

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-03-98b6340d.png', caption: 'AP Invoice Queue — click any row to open the invoice detail screen' },
      ],
    },
    {
      id: 'ap-overview-step2',
      title: 'Step 2: Understanding the Invoice Detail Screen',
      level: 1,
      hideTitle: true,
      content: `### Step 2: Understanding the Invoice Detail Screen

[SCOPE]

Once you select an invoice from the Inbox, the Invoice Detail screen opens displaying a split view. The left panel shows the original vendor invoice PDF for reference, while the right panel contains all the fields required to review, code, and process the invoice. Below is the high level information on the definitions of each item on the invoice detail screen.

**Note: Create Bill** located in the top right-hand corner of the screen to finish processing the invoice.

## Invoice Detail Screen — Field Reference

[IMAGE]

**Left Panel — Invoice**

- **[A]** **Original Vendor Invoice (PDF Preview)** — This is the original vendor invoice in PDF format. Vendor invoices are received via the AP inbox. The AP Manager replies to the sender and forwards the invoice to the Zip inbox at **fluidstack@invoice.ziphq.com**. Once forwarded, the invoice is automatically uploaded into Zip and is ready to be processed.

**Right Panel — Vendor, PO & Invoice Detail**

- **[B]** **Auto-populated Data Indicator** — The **blue star icon** indicates data that **Zip has automatically populated based on its review of the invoice PDF or the linked PO**. Although this information is auto-populated, it is important that you review each field for accuracy by cross-referencing the original PDF invoice and the PO before proceeding.
- **[C]** **View Vendor Record** — Clicking this icon allows you to **access the full vendor record** in Zip. Within the vendor record you can view vendor details such as **payment methods**, **prior spend history** including associated **POs and invoices**, as well as any **documents or agreements** on file for the vendor.
- **[D]** **Purchase Order** — This field displays the **purchase order (PO)** linked to the invoice, if applicable. A PO may be automatically matched by Zip for you to review and accept, or you can manually search for and link the appropriate PO. **When a PO is linked**, this field also displays the **total approved spend on the PO and the amount consumed to date**, allowing you to verify the invoice falls within the approved budget. If there is **no PO** associated with the invoice, the invoice should be **tagged** to the **appropriate requester** using the Requester field.
- **[E]** **Invoice Number** — The unique invoice number as shown on the **vendor's invoice** (e.g., INV-0536). Verify this matches exactly with the invoice number on the PDF.
- **[F]** **Invoice Date** — The date of the invoice as issued by the vendor.
- **[G]** **Posting Date** — The date the invoice will be posted in the system. This defaults to the same date as the invoice date.
- **[H]** **Payment Terms** — The **payment terms** pulled from the invoice or the **vendor record** (e.g., Net 30).
- **[I]** **Due Date** — The payment due date, **automatically calculated by Zip** based on the **invoice date** and the **payment terms**. For example, an invoice dated 06/08/2026 with Net 30 terms will generate a due date of 07/08/2026.
- **[J]** **Subsidiary** — The **FluidStack legal entity** this invoice will be tagged to (e.g., Fluidstack Inc., Fluidstack Ltd.).
- **[K], [Q]** **Department** — The **department** responsible for this expense (e.g., **G&A, Cost of Revenue**).
- **[L]** **FluidStack Location** — Identifies whether the invoice is tagged to a specific **data center location** or **US Shared Services**.
- **[M]** **Description** — A description of the invoiced line items or the header description of the invoice (e.g., Realm Group Holdings Limited - Placement: John Doe - Fee: 25%). This is either auto-populated by Zip or pulled from the invoice and should accurately reflect the nature of the expense.

**Bottom Panel — Line Item Section & Accounting**

- **[N]** **Line Items** — Represents the **individual line items** listed on the **invoice**. **Each line item is displayed separately and must be reviewed and coded individually**. In cases where there is only one charge, only one line item will appear. Additional lines can be added by clicking + Add line if needed.
- **[O]** **Line Type** — Identifies the **type of charge** for the line item. Select from the following: **Expense** — for services and other charges such as shipping, installation, or sales tax; **Item** — for physical products that are shipped and tracked by quantity (e.g., servers, hardware).
- **[P]** **Line Description** — A description of the individual line item as noted on the invoice (e.g., Placement: John Doe Salary: $290,000 - Fee: 25%).
- **[R]** **Account** — The account within FluidStack's chart of accounts that this invoice line item is mapped to (e.g., 60380 Recruitment).
- **[S]** **Unit Price** — The price for the specific line item as stated on the vendor invoice.
- **[T]** **SKU** — The number of units or items purchased for this line item.
- **[U]** **Pre-Tax Total** — The line item total pulled from the invoice excluding any applicable taxes.
- **[V]** **Standard Tax Code** — The tax code applicable based on the location and nature of the expense.
- **[W]** **Standard Tax Amount** — The tax amount associated with the line item based on the applied tax code.
- **[X]** **Total Price** — The total amount for the line item inclusive of both the unit price and any applicable taxes.
- **[Y]** **Amortization Schedule** — If an expense covers a specific period (e.g., rent, SaaS subscriptions), the total invoice amount should be expensed over the term of the invoice rather than all at once. Select the appropriate amortization method from the dropdown to spread the expense across the relevant period.
- **[Z]** **Start Date** — The date the service or subscription period begins. This is used in conjunction with the amortization schedule to determine how the expense is spread over time.
- **[AA]** **End Date** — The date the service or subscription period ends. Together with the start date, this defines the full amortization period for the expense.
- **[AB]** **Part Number** — The vendor's part number for the line item, if applicable. This field is not required and can be left blank.
- **[AC]** **Billable / Passthrough** — Indicates whether this expense was incurred on behalf of a customer and is subject to passthrough billing. This is applicable for supplier infrastructure costs or certain expenses related to customers such as Anthropic that are passed through rather than absorbed by FluidStack.
- **[AD]** **Customer to Bill** — The customer entity this expense needs to be passed through or billed to (e.g., Anthropic). This field is required when the Billable / Passthrough flag is selected.

**Invoice Totals**

[IMAGE]

- **[AE]** **Invoice Totals (Pre-Tax Total, Standard Tax Amount & Total Amount)** — These figures are pre-populated by Zip and are pulled directly from the PDF invoice.
- **[AF]** **Line Item Subtotals (Bottom Bar)** — The subtotal bar at the bottom of the screen (Subtotal, Tax, and Total) is calculated and pulled from the Line Item section.

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-05-322afa0d.png', caption: 'Invoice Detail Screen — full annotated field reference (A–AD)' },
        { file: 'ap-06-755e7994.png', caption: 'Invoice Totals — AE (totals summary) and AF (line item subtotals bar)' },
        { file: 'ap-04-139c151d.png', caption: 'Create Bill button — top right corner of Invoice Detail screen', size: 'small' },
      ],
    },
    {
      id: 'ap-overview-step3',
      title: 'Step 3: Processing the AP Invoice — Coding',
      level: 1,
      hideTitle: true,
      content: `### Step 3: Processing the AP Invoice — Coding

This section provides a detailed **step-by-step guide** on how to **verify** and **code an invoice** for processing in Zip. Specifically, this covers reviewing and updating the **right-hand side panel** and **bottom panel** of the **Invoice Detail Screen**. This is illustrated in detail within various sub tabs. See sections linked below.

- [Vendor and Payment Method Verification](tab:vendor-payment)
- [Purchase Order Matching and Verification](tab:po-matching)
- [Invoice Detail Review](tab:invoice-detail)
- [Line Item Section & Accounting](tab:line-items)
- [Invoice Totals Section](tab:totals-create-bill)

> 🚨 **Best Practice!! — Before You Get Started —** Before coding a new invoice, always review previously processed invoices for the same vendor. Invoices that have been reviewed by AP, Accounting, and the requester have already been validated, meaning the coding and mapping should generally be consistent with prior invoices and serve as a reliable reference when processing new invoices.

→ **View Vendor Record:** To access previously processed invoices for the vendor, **click the arrow next to the vendor name** at the top of the invoice detail screen.

[IMAGE]

→ **Review Prior Invoices:** Within the vendor record, click on **Spend** in the left-hand navigation and then select the **Invoices** tab. This will display all **previously processed invoices for the vendor**. Focus on invoices with a status of **Payment Sent**, **Payment Scheduled**, or **Paid Offline**, as these have completed the full review cycle — including AP, Requester, and Accounting review — and have been fully validated. Ignore invoices with a status of Uncoded as these have not completed the review process.

[IMAGE]`,

      images: [
        { file: 'ap-08-8e91d5d4.png', caption: 'View Vendor Record — click the arrow next to the vendor name to open the full vendor record' },
        { file: 'ap-09-7961ad22.png', caption: 'Prior invoice history — filter by Payment Sent, Payment Scheduled, or Paid Offline for reliable coding references' },
      ],
    },
    {
      id: 'vendor-verification',
      title: 'Vendor Verification',
      level: 2,
      hideTitle: true,
      content: `### Vendor Verification

[SCOPE]

Confirm that the **vendor name displayed in Zip** (top of the right panel) **agrees with the vendor name shown on the PDF invoice on the left**. If the names agree, you may proceed with coding. If the vendor name in Zip **does not match the invoice**, this indicates the **vendor has not been set up in NetSuite** and will need to be added before the invoice can be processed. See **vendor setup instructions**.

If the **vendor does not exist in Zip**, the vendor record **must first be** **created in NetSuite**. Once added in NetSuite, the **vendor will automatically sync to Zip** and become available for invoice processing. See [Appendix A — How to add a new vendor into NetSuite](tab:appendix).

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-10-db2228de.png', caption: 'Vendor not in NetSuite — setup required before processing' },
      ],
    },
    {
      id: 'payment-method-verification',
      title: 'Payment Method Verification',
      level: 2,
      hideTitle: true,
      content: `[DIVIDER:Payment Method Verification]

### Payment Method Verification

[SCOPE]

Check the Payment Method field below the vendor name. **If Zip has already preloaded** the vendor's payment method (e.g., ACH bank account details), **verify it is correct** before proceeding by **comparing the last four digits** of the **vendor bank account number** against the banking details on the invoice.

[IMAGE]

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-12-77f23a2d.png', caption: 'Preloaded payment method — verify last four digits match banking details on the invoice' },
        { file: 'ap-11-8927c36b.png', caption: 'Remittance section on invoice — find ACH routing number and account number here' },
      ],
    },
    {
      id: 'adding-new-payment-method',
      title: 'Adding New Payment Method',
      level: 2,
      hideTitle: true,
      content: `[DIVIDER:Adding New Payment Method]

### Adding New Payment Method

**Step 1** — **If the payment method shows a ⚠ Missing** warning, click the **pencil icon** on the right to **add the vendor's payment details manually**.

**Note:** **Before you begin adding a new payment method**, if you are using the banking details from the vendor invoice, **download the invoice PDF first**. If you navigate away from the payment method screen to refer back to the invoice in Zip, Zip will exit you out of the payment method setup process and you will need to start over.

[IMAGE]

---

**Step 2** — **When the Edit Payment Method** panel opens, use the dropdown to select an existing payment method on file for the vendor. If no payment method exists, click **Add new payment method** to enter the vendor's banking details.

---

**Step 3** — When prompted to update/edit payment info, you will be presented with two options:

- **Add Directly** — Select this option to manually enter the vendor's banking details yourself. Use this when you have the vendor's payment information on hand from the invoice or a verified source.
- **Request from Vendor** — Select this option to send the vendor a request to submit their own payment details directly into Zip.

Choose an option and click **Continue**.

[IMAGE-PAIR]

---

**Step 4** — When adding payment details directly, select whether the account is a **Company** or **Personal** account (**Company should always be selected**), then select the **Bank Country** and **Account Currency**. Based on these selections, choose the appropriate payment method:

**For US-based vendors (US based banks — USD):**
- **ACH** *(Preferred)* — Local bank transfer. Use for domestic US vendors where standard ACH transfer is available.
- **Fedwire** — Real-time bank transfer. Use when same-day or urgent domestic payment is required.
- **Paper Check** — Transfer by issuing a paper check. Use only when electronic payment is not available.
- **International Wire** — International bank transfer. Use for foreign vendors or invoices billed in a foreign currency.

**For International vendors (e.g., UK-based vendors paid in GBP):**
- **Faster Payments** *(Preferred)* — Real-time local bank transfer processed through SWIFT/sort codes. This is the international equivalent of ACH and is the preferred method for UK-based vendors.
- **Wire** — International bank wire transfer. Use when Faster Payments is not available.

[IMAGE-PAIR]

---

**Step 5** — Once a payment method is selected, complete the required bank information fields by cross-referencing the remittance information on the vendor invoice PDF:

- **Bank Name** — Enter the name of the vendor's bank as shown in the remittance section of the invoice (e.g., Bank of America).
- **Account Holder Name** — Enter the company or individual name exactly as it appears on the bank statement (e.g., GitHub, Inc.). This must match the name on the invoice.
- **ACH Routing Number** — Enter the 9-digit routing number used for ACH transfers as shown on the invoice (e.g., 121000358). Note that some invoices may list both an ACH routing number and an EFT routing number — always use the ACH routing number.
- **Account Number** — Enter the vendor's bank account number as shown on the invoice (e.g., 1291743886).

Once all fields are completed, save the payment method before proceeding.

[IMAGE-PAIR]

---

**Step 6** — After entering the bank information, Zip will prompt you to add the account holder's address details. Complete the following fields by cross-referencing the vendor's address as shown on the invoice:

- **PO Email** *(Optional)* — The vendor's email address for purchase order notifications, if applicable.
- **Remittance Email** *(Optional)* — The vendor's email address for payment remittance notifications, if applicable.
- **Business Name** — The vendor's legal business name as shown on the invoice (e.g., GitHub, Inc.).
- **Country or Region** — The vendor's country as shown on the invoice (e.g., United States of America).
- **Address** — The vendor's street address as shown on the invoice. Note that this should not be a PO Box or GPO Box address.
- **City** — The vendor's city as shown on the invoice (e.g., San Francisco).
- **State** — The vendor's state as shown on the invoice (e.g., California).
- **ZIP Code** — The vendor's postal code as shown on the invoice (e.g., 94107).

Once all address fields are completed, save to finalize the payment method setup.

[IMAGE-PAIR]

---

**Step 7** — The final step when adding a payment method is to upload supporting documentation to confirm the vendor's payment details are valid and secure. Upload at least one of the following supporting documents:

- **Void Check** — A voided check from the vendor confirming their bank account and routing number.
- **Bank Letter** — An official letter from the vendor's bank confirming their account details.
- **Invoice** — A copy of the vendor invoice that contains the remittance/banking details used to set up the payment method.

In the Comment field, enter a brief note describing how the payment method was verified (e.g., "Banking details confirmed against remittance information on invoice INV-0536 dated 06/08/2026").

Once the document is uploaded and the comment is added, click **Submit** to submit the new payment method for AP Manager approval.

[IMAGE]`,
      images: [
        { file: 'ap-13-1bc0df11.png', caption: 'Missing payment method warning — click pencil icon to add details' },
        { file: 'ap-14-8d067ae1.png', caption: 'Edit Payment Method dialog — click Add new payment method' },
        { file: 'ap-15-9fc4ed1f.png', caption: 'Choose method — Add Directly or Request from Vendor' },
        { file: 'ap-16-f72a42a5.png', caption: 'US vendor — ACH (Preferred) for USD bank accounts' },
        { file: 'ap-17-4ebaffbb.png', caption: 'UK / International vendor — Faster Payments or International Wire' },
        { file: 'ap-18-209b316d.png', caption: 'From Invoice (example) — locate Bank Name, Account Holder Name, ACH Routing Number and Account Number in the remittance section' },
        { file: 'ap-19-33e67dbd.png', caption: 'Add payment method — Bank information: enter Bank Name, Account Holder Name, ACH Routing Number and Account Number' },
        { file: 'ap-20-858229f5.png', caption: 'From Invoice (example) — locate Business Name and Address details on the vendor invoice header' },
        { file: 'ap-21-d21d59df.png', caption: 'Add payment method — Address: enter Business Name, Country, Street Address, City, State and ZIP Code' },
        { file: 'ap-22-f1e0c755.png', caption: 'Upload supporting document and enter verification comment — submit for AP Manager approval' },
      ],
    },
    {
      id: 'po-matching',
      title: 'PO Matching',
      level: 2,
      content: `🚨 **FluidStack Policy**

**It is FluidStack's policy to operate on a No PO**, **No Pay basis**. All invoices that are ready to be processed should have an associated purchase order (PO) prior to processing. There are rare circumstances where a PO may not be available, such as certain legal invoices or one-time purchases. However, if a review of prior invoices reveals a history of recurring purchases or a monthly invoice from the same vendor, it is important to follow up with the requester to transition to a PO-backed process in order to remain aligned with FluidStack's procurement policies.`,
      images: [],
    },
    {
      id: 'po-matching-non-po',
      title: 'Non-PO Invoices',
      level: 2,
      hideTitle: true,
      content: `### Non-PO Invoices (Example: Legal Invoices)

[SCOPE]

Since there is **no PO associated with these invoices**, it is the responsibility of the AP processor reviewing the invoice to **identify and tag the correct requester** before the invoice can be routed for approval.

**Identify the Requester:** Review **prior processed invoices** for the **same vendor** to identify who the requester of the service is. Based on the invoice history, there may be multiple requesters, however they should generally belong to the same department (e.g., the Legal department or Legal Counsel in the case of legal invoices).

In many cases, the **invoice itself provides the clearest indication** of the requester. For example, a Cooley invoice addressed to **Dennis Wallace, General Counsel, FluidStack Inc**. directly identifies the requester. This is the best case scenario as it removes any ambiguity.

[IMAGE-PAIR]

Once the requester is identified, type their name in the **Requester** field on the invoice detail screen and select the appropriate person from the dropdown list (e.g., Dennis Wallace - dennis@fluidstack.io). This tags the requester to the invoice and ensures it is routed correctly for approval.

[/SCOPE]`,
      images: [
        { file: 'ap-23-3c3ae8a1.png', caption: 'From Invoice (Example 1) — Cooley invoice: billing address identifies requester (Dennis Wallace, General Counsel)' },
        { file: 'ap-24-2be3883b.png', caption: 'From Invoice (Example 2) — invoice identifies requester; type name in Requester field and select from dropdown' },
      ],
    },
    {
      id: 'po-matching-po-based',
      title: 'PO-Based Invoices',
      level: 2,
      hideTitle: true,
      content: `[DIVIDER:PO-Based Invoices]

### PO-Based Invoices

[SCOPE]

To code the invoice, **first review the PO Match section** and ensure that the **invoice** has been matched to the **correct purchase order**, if applicable. Zip automatically tries to match the correct PO or suggest some of the vendor's outstanding purchase orders matching the subsidiary and currency of the invoice. The following steps need to be performed to ensure that the correct PO is tagged.

### No PO has been tagged

If no PO has been matched to the invoice, and a review of prior invoices reveals a history of recurring purchases or a monthly invoice from the same vendor (and it is not a one-time or legal invoice), it is **important to follow up** with the **requester** to either **obtain a PO from the vendor or set up a PO in the Zip system**. This is required in order to remain **aligned** with FluidStack's **No PO, No Pay procurement policy**.

### ZIP tagged a PO — Correct PO has been Tagged

If Zip has already automatically matched a PO to the invoice, verify that the PO is correct before proceeding. Cross-reference the following between the invoice PDF and the Zip-tagged PO to confirm the match is accurate:

- **Vendor Name** — Confirm the vendor name on the invoice (e.g., Vertiv Corporation) matches the vendor tagged in Zip.
- **PO Number** — Confirm the PO number referenced on the invoice (e.g., PO Number / Contract Number: 444) matches the PO tagged in Zip (e.g., PO #444: Vertiv - TUL101 CDUs).

Once both the vendor name and PO number are confirmed to agree, the PO match is verified and you may proceed with coding the remaining invoice fields.

[IMAGE-PAIR]

### ZIP tagged a PO — Incorrect PO has been Tagged

If the wrong PO has been automatically matched to the invoice, click the **pencil icon** on the right side of the PO field to open the full list of open POs for the vendor. The list displays key details including PO number, description, requester, start date, end date, total amount, and remaining open balance to help you identify the correct PO.

From here you have two options:

- **Select the Correct PO** — Review the list and select the radio button next to the correct PO that corresponds to the invoice. Cross-reference the PO number and description against the invoice to confirm the match, then click **Submit**.
- **Don't Match to Any PO** — If none of the listed POs correspond to the invoice, click **Don't Match to Any PO**. In this case, follow up with the requester to create a new PO in Zip for this invoice before proceeding with payment.

[IMAGE]

### Zip could not tag the correct PO

If no PO has been automatically matched to the invoice, Zip may still suggest outstanding purchase orders for the same vendor that match the subsidiary and currency of the invoice. To manually match the correct PO:

- Hover your mouse cursor over the **Match** button next to a suggested PO to view more information before committing to a match.
- Once you have identified the correct PO, click **Match** to link the invoice to the appropriate PO.

Cross-reference the PO number on the vendor invoice, or click on the **PO link** in the suggested list to view additional details, to confirm you are selecting the correct PO before clicking **Match**.

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-26-2cdd18fe.png', caption: 'From Invoice (example) — Vertiv invoice showing PO Number / Contract Number: 444' },
        { file: 'ap-27-b42ef264.png', caption: 'Invoice Detail View (example) — Vertiv matched to PO #444: Vertiv TUL101 CDUs' },
        { file: 'ap-28-cf96febe.png', caption: 'Match PO dialog — select correct PO or choose Don\'t Match to Any PO' },
        { file: 'ap-29-c15a976f.png', caption: 'Hover over Match button to view PO details before committing' },
      ],
    },
    {
      id: 'invoice-detail-review',
      title: 'Invoice Detail Review',
      level: 2,
      content: `The **Invoice Details** section contains key header-level information about the invoice. Fields marked with a **blue star (✦)** icon have been pre-populated by Zip based on its review of the invoice PDF or the linked PO. All fields must be reviewed and verified for accuracy before proceeding, even when pre-populated by Zip.`,
      images: [],
    },
    {
      id: 'invoice-detail-po',
      title: 'PO Based Invoices',
      level: 2,
      hideTitle: true,
      content: `### PO Based Invoices

[SCOPE]

The **Invoice Details** section contains key header-level information about the invoice. Fields marked with a **blue star (✦)** icon have been pre-populated by Zip based on its review of the invoice PDF or the linked PO. All fields must be reviewed and verified for accuracy before proceeding, even when pre-populated by Zip. This section includes the following fields:

- Invoice Number
- Invoice Date
- Posting Date
- Payment Terms
- Due Date
- Subsidiary
- Department
- FluidStack Location
- Description

Please see below for how to review and validate the information within this section of the Invoice Detail View.

### Example Review and Coding of Invoice Details Section

**Invoice Number, Invoice Date, Posting Date, Payment Terms, Due Date, Subsidiary & Description**

[IMAGE-PAIR]

**Invoice Number:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the invoice number in Zip (e.g., INV-00240) matches the invoice number on the PDF invoice. This is a required field and must be accurate to avoid duplicate payment risk.

**Invoice Date:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the invoice date in Zip (e.g., 06/05/2026) matches the invoice date on the PDF invoice.

**Posting Date:** The posting date defaults to the same date as the invoice date. No action is required unless a different posting date is needed for accounting purposes.

**Payment Terms:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the payment terms pulled by Zip (e.g., NT45) match the terms stated on the PDF invoice. If Zip displays "Other," this either means the specific payment terms are not available as an option in Zip, or Zip was unable to identify the payment terms from the invoice.

**Due Date:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the due date (e.g., 07/20/2026) is correctly calculated based on the invoice date and payment terms. Cross-reference against the due date stated on the PDF invoice if one is provided.

**Subsidiary:** When a **PO is linked to the invoice**, the **Subsidiary field is pulled directly from the PO** and cannot be edited by the reviewer (indicated by the greyed out appearance). The reviewer must ensure that the **subsidiary populated** from the PO **agrees with the subsidiary named on the vendor invoice**. For example, if the PO is tied to Fluidstack USA I Inc. but the invoice is addressed to Fluidstack Inc., these **do not agree and the invoice cannot be processed in Zip**. In this case, the reviewer must reach out to the **PO requester to contact the vendor and request a corrected invoice** with the correct subsidiary before processing can continue.

**Description:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the description accurately reflects the invoiced goods or services as described on the PDF invoice. Update if Zip has pulled an incorrect or incomplete description.

---

**FluidStack Location**

**FluidStack Location:** When a **PO is linked to the invoice**, the **FluidStack Location can be identified by accessing the PO details.** Click on the PO link at the top of the Invoice Detail View (e.g., PO #486: CPI Racks Cable Manager - CB4) to navigate to the PO details page.

[IMAGE]

On the **PO details page**, navigate to the **Purchase Terms section** where you will find the **FluidStack Location field** (e.g., Americas: United States: NY: BUF1 [Lake Mariner]: BUF1 [CB4]). You can also use this screen to verify the Subsidiary (e.g., Fluidstack USA I Inc.) agrees with the invoice. **Once confirmed, select the matching location in the FluidStack Location field on the invoice.**

[IMAGE]

[/SCOPE]`,
      images: [
        { file: 'ap-31-b7c4dea4.png', caption: 'From Invoice — vendor invoice PDF: cross-reference Invoice No., Date, Terms, Customer Reference (PO #486)' },
        { file: 'ap-33-42dea0a9.png', caption: 'Invoice Detail View — PO #486 matched; verify Invoice Number, Date, Payment Terms, Subsidiary, FluidStack Location, and Description' },
        { file: 'ap-34-463b1b5b.png', caption: 'Invoice Detail View — click the PO link to navigate to the PO details page' },
        { file: 'ap-35-90b261ca.png', caption: 'PO Purchase Terms — Subsidiary (Fluidstack USA I Inc) and FluidStack Location confirmed' },
      ],
    },
    {
      id: 'invoice-detail-non-po',
      title: 'Non-PO Invoices',
      level: 2,
      hideTitle: true,
      content: `[DIVIDER:Non-PO Invoices]

### Non-PO Invoices — Subsidiary, Department & FluidStack Location Coding (Example: Legal, Recruitment Invoices)

[SCOPE]

For non-PO invoices, the review and coding process is largely the same as PO-backed invoices. However, since there is no linked PO to pull coding information from, the following fields require additional attention and judgment from the reviewer. As always, review prior processed invoices for the same vendor as a reference before coding:

- Subsidiary
- Department
- FluidStack Location

The guidance below covers how to code each of these fields specifically for non-PO invoices such as legal or recruitment invoices.

---

**→ Subsidiary**

[IMAGE-PAIR]

**Subsidiary:** For non-PO invoices, the **subsidiary should be identified directly** **from the vendor invoice**. The invoice will typically display the FluidStack entity name in the billing address or header section. For example, a Cooley invoice addressed to Dennis Wallace, General Counsel, Fluidstack Inc. indicates that the correct subsidiary to select is Fluidstack Inc. Click on the Subsidiary dropdown to view all available FluidStack legal entities.

---

**→ Department**

[IMAGE-PAIR]

**Department:** For non-PO invoices, the department should be determined based on the nature of the expense. Click on the Department dropdown and select the appropriate department. Use the following examples as a guide:

- **General & Administrative : Legal** — For legal invoices such as outside counsel fees (e.g., Cooley invoices addressed to General Counsel).
- **General & Administrative : Accounting & Finance** — For accounting, audit, or finance-related invoices.
- **General & Administrative : Talent** — For recruitment or placement fee invoices (e.g., hiring agency fees).
- **General & Administrative : People Operations** — For people-related purchases such as employee swag or HR-related expenses.
- **General & Administrative : Information Security** — For information security related invoices.
- **Cost of Revenue** — For supplier infrastructure invoices directly related to FluidStack's service delivery.

As always, review prior processed invoices for the same vendor to confirm the department coding that has been used historically before making a selection.

---

**→ FluidStack Location**

[IMAGE-PAIR]

**FluidStack Location:** For non-PO invoices, the FluidStack Location should be determined based on the nature and purpose of the expense. Click on the FluidStack Location dropdown to search and select the appropriate location. Use the following as a guide:

- **Americas : United States : US Shared Services** — Use for invoices related to general business operations or employment matters (e.g., legal, HR), recruitment and placement fee invoices, and information security invoices related to the overall operations of FluidStack.
- **Specific Data Center Location** — If the legal invoice relates to a specific data center or a potential data center, select the corresponding data center location from the dropdown (e.g., Americas: United States: TX: SNK1 [Barber Lake], Americas: United States: NY: BUF1 [Lake Mariner]).
- **Potential DC Site** — If the legal invoice relates to a data center that is currently in the pipeline or under consideration, select the Potential DC location.

As always, review prior processed invoices for the same vendor to confirm the FluidStack Location coding that has been used historically before making a selection.

[/SCOPE]`,
      images: [
        { file: 'ap-36-2be3883b.png', caption: 'From Invoice (Example) — Legal Invoice (Cooley): billing address shows "Fluidstack Inc." — identifies the correct Subsidiary' },
        { file: 'ap-37-aa99619e.png', caption: 'Zip Invoice Detail — Subsidiary dropdown: select the matching FluidStack entity (e.g., Fluidstack Inc.)' },
        { file: 'ap-38-2be3883b.png', caption: 'From Invoice (Example 1) — Legal Invoice (Cooley): addressed to General Counsel → General & Administrative : Legal' },
        { file: 'ap-39-84d2ac90.png', caption: 'From Invoice (Example 2) — Recruitment Invoice (Insight Global): placement fee → General & Administrative : Talent' },
        { file: 'ap-41-84d2ac90.png', caption: 'From Invoice (Example) — Recruitment Invoice (Insight Global): placement fee for general operations → Americas : United States : US Shared Services' },
        { file: 'ap-42-43d88fae.png', caption: 'Zip Invoice Detail — FluidStack Location dropdown: select the appropriate location (e.g., Americas : United States : US Shared Services)' },
      ],
    },
    {
      id: 'line-items',
      title: 'Line Items & Accounting Review',
      level: 2,
      content: `The Line Items section of the page lists the individual line items from the bill. It is expanded and displayed by default. Fields marked with a **blue star (✦)** icon have been pre-populated by Zip based on its review of the invoice PDF and the linked PO. This section includes the following fields:

- Line Type
- Line Description
- Department
- Item
- Account
- Quantity
- Unit Price
- SKU
- Pre-Tax Total
- Standard Tax Code
- Standard Tax Amount
- Total Price
- Amortization Schedule
- Start Date
- End Date
- Part Number
- Billable / Passthrough
- Customer to Bill

Please see below for how to review and validate the information within this section of the Invoice Detail View.`,
      images: [],
    },
    {
      id: 'line-items-example1',
      title: 'Example 1: Non-PO Based (Service) — Recruitment / Placement',
      level: 2,
      hideTitle: true,
      content: `[EXAMPLE:1:Non-PO Based (Service) — Recruitment / Placement]

[SPLIT]

**Line Item Review — Example: Non PO-Backed Invoice (Recruitment)**

**Note:** There is only one line item in this invoice and thus there is only one tab to complete.

[IMAGE]

[SPLIT-DIVIDER]

**Line Type:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the line type is correctly identified. For service-based invoices such as **recruitment or legal fees**, the line type should be **Expense**. Cross-reference the invoice to confirm the nature of the charge.

**Line Description:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the line description matches the description of the line item on the PDF invoice (e.g., John Doe | Network Engineer - Deployment & Integration). Update if Zip has pulled an incorrect or incomplete description.

**Department:** **The department selected here should agree with the department coded in the Invoice Detail section above**. Both fields must be consistent with each other. For recruitment and placement fee invoices, the department should be **General & Administrative : Talent**. As always, review prior processed invoices for the same vendor to confirm historical coding.

**Account:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the account is correctly mapped to the appropriate chart of accounts code. For example:
- **60380 Recruitment** — For recruitment and placement fee invoices.
- **60300 Legal** — For legal invoices such as outside counsel fees.

**This field may be tagged incorrectly by Zip and thus it is of paramount importance to verify this before proceeding**. Always cross-reference previously processed invoices for the same vendor to confirm the correct account mapping. **If you are unsure**, **reach out to the Accounting team** to ensure the tagging is appropriate before submitting the invoice for approval.

**Unit Price:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the unit price matches the amount stated on the PDF invoice (e.g., $78,000.00) and **Invoice Totals**.

**SKU:** Not applicable for service-based invoices such as placement fees. This field can be left blank.

**Pre-Tax Total:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the pre-tax total matches the subtotal on the PDF invoice before any taxes are applied (e.g., $78,000.00).

**Standard Tax Code:** Verify the correct tax code is applied based on the location of the vendor and the nature of the expense. For example:
- **Not Taxable - 0.0%** — For placement fee and recruitment invoices from US-based vendors, as recruitment fees are generally not subject to sales tax in the US.
- **S-GB 20% - 20.00%** — For legal and placement fee invoices from UK-based vendors, as VAT is charged on these services in the United Kingdom. Verify the tax code selected agrees with the VAT amount shown on the invoice.

**Standard Tax Amount:** Verify the tax amount is correct based on the applied tax code and agrees with the tax amount shown on the PDF invoice. For example:
- **US-based invoices** — For non-taxable invoices, the standard tax amount should be **$0.00**.
- **UK-based invoices** — For invoices subject to VAT at 20%, the standard tax amount should equal 20% of the pre-tax total. Verify this agrees with the VAT amount stated on the PDF invoice.

**Total Price:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the total price equals the pre-tax total plus any applicable taxes and agrees with the balance due on the PDF invoice (e.g., $78,000.00).

**Amortization Schedule:** Not applicable for one-time placement fee invoices. This field can be left blank.

**Start Date / End Date:** Not applicable for one-time placement fee invoices. These fields can be left blank.

**Part Number:** Not applicable for service-based invoices. This field can be left blank.

**Billable / Passthrough:** This field has been pre-populated by Zip (indicated by the **blue star** icon). For internal recruitment invoices, this should be set to **No** as the expense is not being passed through to a customer.

**Customer to Bill:** Not applicable when Billable / Passthrough is set to No. This field can be left blank.

[/SPLIT]`,
      images: [
        { file: 'ap-44-e621c39e.png', caption: 'Blue Signal recruitment invoice + Zip line item detail — placement fee $78,000; Line Type: Expense; Account: 60380 Recruitment; Dept: G&A : Talent' },
      ],
    },
    {
      id: 'line-items-example2',
      title: 'Example 2: Non-PO Based (Service) — SaaS Subscription',
      level: 2,
      hideTitle: true,
      content: `[EXAMPLE:2:Non-PO Based (Service) — SaaS Subscription]

[SPLIT]

**Line Item Review — Example: SaaS Subscription Invoice (GitHub)**

**Note:** There is only one line item in this invoice and thus there is only one tab to complete.

[IMAGE]

[IMAGE]

[SPLIT-DIVIDER]

**Line Type:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the line type is correctly identified. For SaaS subscription invoices, the line type should be **Expense**. Cross-reference the invoice to confirm the nature of the charge.

**Line Description:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the line description matches the description of the line item on the PDF invoice (e.g., GitHub Enterprise Annual - Proration Jun 03, 2026 - Jan 19, 2027). Update if Zip has pulled an incorrect or incomplete description.

**Department:** The department selected here should agree with the department coded in the Invoice Detail section above. Both fields must be consistent with each other. For SaaS subscription invoices for the **overall company/enterprise**, the department should reflect the team that owns and uses the software (e.g., General & Administrative : Information Security). As always, review prior processed invoices for the same vendor to confirm historical coding.

**Account:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the account is correctly mapped to the appropriate chart of accounts code. For SaaS subscription invoices, the account should be **60500 Software Subscriptions**. **This field may be tagged incorrectly by Zip and thus it is of paramount importance to verify this**. Always cross-reference previously processed invoices for the same vendor to confirm the correct account mapping. **If you are unsure, reach out to the Accounting team** to ensure the tagging is appropriate before submitting the invoice for approval.

**Unit Price:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the unit price matches the subtotal amount stated on the PDF invoice (e.g., $6,778.11).

**SKU:** Not applicable for SaaS subscription invoices. This field can be left blank.

**Pre-Tax Total:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the pre-tax total matches the subtotal on the PDF invoice before any taxes are applied (e.g., $6,778.11).

**Standard Tax Code:** Verify the correct tax code is applied based on the location of the vendor and the nature of the expense. Cross-reference the tax amount on the PDF invoice to confirm the correct tax code has been selected. **For US-based invoices, you can skip this field and enter the tax amount directly in the Standard Tax Amount field.**

**Standard Tax Amount:** This field has been pre-populated by Zip (indicated by the blue star icon). Verify the tax amount agrees with the tax amount shown on the PDF invoice (e.g., $601.56).

**Total Price:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the total price equals the pre-tax total plus applicable taxes and agrees with the balance due on the PDF invoice (e.g., $7,379.67).

**Amortization Schedule:** This field has been pre-populated by Zip (indicated by the blue star icon). For invoices that cover a specific period, an amortization schedule should be applied to spread the expense over the term. Verify the correct amortization method is selected from the dropdown. Available options include:
- **PPD IT Software** — For SaaS and software subscription invoices.
- **PPD COGS** — For cost of goods (Cost of Revenue) sold related expenses.
- **PPD Insurance** — For insurance premium invoices.
- **PPD Rent** — For rent and lease related invoices.
- **PPD Other** — For other prepaid expenses not covered by the above categories.

**Start Date:** This field has been pre-populated by Zip (indicated by the blue star icon). Verify the start date matches the beginning of the subscription period as stated on the invoice (e.g., 06/03/2026).

**End Date:** Verify the end date matches the end of the subscription period as stated on the invoice (e.g., 01/19/2027).

**Part Number:** Not applicable for SaaS subscription invoices. This field can be left blank.

**Billable / Passthrough:** This field has been pre-populated by Zip (indicated by the blue star icon). For internal SaaS subscription invoices, this should be set to **No** unless the software cost is being passed through to a customer.

**Customer to Bill:** Not applicable when Billable / Passthrough is set to No. This field can be left blank.

[/SPLIT]`,
      images: [
        { file: 'ap-45-9d095599.png', caption: 'GitHub SaaS invoice — Enterprise Annual proration Jun 03 2026 – Jan 19 2027; 50 seats at $214.20; total $7,379.67' },
        { file: 'ap-46-d8da2357.png', caption: 'Zip line item detail — GitHub: Line Type: Expense; Account: 60500 Software Subscriptions; Amortization: PPD IT Software; Start: 06/03/2026; End: 01/19/2027' },
      ],
    },
    {
      id: 'line-items-example3',
      title: 'Example 3: PO Based (Equipment) — Data Center Equipment',
      level: 2,
      hideTitle: true,
      content: `[EXAMPLE:3:PO Based (Equipment) — Data Center Equipment (Fixed Assets)]

[SPLIT]

**Line Item Review — Example: PO-Backed Invoice (Data Center Equipment)**

This invoice has **4 line items** (Lines 1, 2, 3, and 4). See all screenshots on the left.

[IMAGE]

[IMAGE]

[IMAGE]

[IMAGE]

[SPLIT-DIVIDER]

**Line Item Review — Example: PO-Backed Invoice (Data Center Equipment)**

This invoice has **4 line items** and thus there are 4 tabs to complete. Each line item tab must be reviewed individually.

**For PO-backed invoices, Zip automatically populates most fields from the linked PO and these fields will appear greyed out and cannot be edited by the reviewer.** If any greyed out fields are incorrect, contact the PO requester to update the PO accordingly. The only fields the reviewer can update are the **Matched PO Line**, **Line Description**, and **Quantity**.

**Matched PO Line:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Zip will automatically attempt to match each invoice line item to the corresponding PO line item. **Verify that the correct PO line** has been **matched to each invoice line** by **cross-referencing the line description and amount** on the PDF invoice against the PO line options available in the dropdown (e.g., Line 1 - Chatsworth ZetaFrame - TSZ1070121 - Rack: $1,141,252.33 open, Line 2 - Chatsworth EA-67F7W-C - 60A rPDU: $1,645,286.00 open). **If the wrong PO line has been matched, click the dropdown and select the correct PO line.**

**Line Type:** Pre-populated from the PO and greyed out. For physical products such as hardware and equipment, the line type will be **Item**. If this is incorrect, contact the PO requester to update.

**Line Description:** Verify the line description matches the product description on the PDF invoice (e.g., Chatsworth ZetaFrame - TSZ1070121). This field can be updated by the reviewer if needed.

**Department:** Pre-populated from the PO and greyed out (e.g., Technology & Infrastructure: Data Centers). **If this is incorrect, contact the PO requester to update.**

**Item:** Pre-populated from the PO and greyed out (e.g., FA - Racks). **If this is incorrect, contact the PO requester to update.**

**Account:** Pre-populated from the PO and greyed out (e.g., 15100 Racks). **If this is incorrect, contact the PO requester to update.**

**Quantity:** This field has been pre-populated by Zip (indicated by the blue star icon). Verify the quantity matches the quantity stated on the PDF invoice for the corresponding line item (e.g., 289 for Line 1, 381 for Line 2). This field can be updated by the reviewer if needed.

**Unit Price:** Pre-populated from the PO and greyed out (e.g., $3,948.97 for Line 1, $2,836.70 for Line 2). Verify this agrees with the unit price on the PDF invoice. **If this is incorrect, contact the PO requester to update.**

**Pre-Tax Total:** Pre-populated from the PO and greyed out. Verify this agrees with the line item amount on the PDF invoice before taxes (e.g., $1,141,252.33 for Line 1).

**Standard Tax Code:** Verify the correct tax code is applied. For US-based invoices, you can skip this field and enter the tax amount directly in the Standard Tax Amount field.

**Standard Tax Amount:** This field has been pre-populated by Zip (indicated by the **blue star** icon). Verify the tax amount agrees with the tax amount shown on the PDF invoice. Note that for **PO-backed invoices** with multiple line items, **the total tax across all lines should equal the total tax** on the invoice (e.g., $222,923.07). It is **best practice** to **add a separate line item for taxes at the time of PO creation (this is the same for shipping costs)**, so that Zip can automatically tag and populate the tax line alongside the assets being purchased — as demonstrated in this example. Alternatively, **if a tax line was not included in the PO**, the **tax can be added as a separate line item during invoice processing** — **in this example, Line 4** is used to capture the total tax amount for the invoice rather than splitting it across individual line items.

**Line 1 (Chatsworth ZetaFrame Rack) and Line 2 (Chatsworth PDU)** — See screenshots on the left. Verify Matched PO Line, Quantity, and Part Number for each line.

**Line 4 — Tax Line Item**

Line 4 is used to capture the total tax amount for the invoice. Since this line is not tied to a specific PO line, set the **Matched PO Line** to **Not Matched**. The tax should be charged to the same account as the assets being purchased — in this example, **15100 Racks**. Enter the total tax amount in the **Standard Tax Amount** field (e.g., $222,923.07).

**Note: Under US GAAP, sales tax and shipping costs paid on the acquisition of a capital asset is considered part of the cost of the asset and should be capitalized to the same asset account rather than expensed separately.**

**Total Price:** Pre-populated and greyed out. Verify the total price equals the pre-tax total plus any applicable taxes and agrees with the corresponding line item total on the PDF invoice.

**Part Number:** This field has been pre-populated by Zip (indicated by the blue star icon). Verify the part number matches the product code on the PDF invoice (e.g., TSZ1070121 for Line 1, EA-67F7W-C for Line 2).

**Amortization Schedule / Start Date / End Date:** Not applicable for physical product invoices. These fields can be left blank.

**Billable / Passthrough:** Pre-populated from the PO and greyed out. **If this is incorrect, contact the PO requester to update.**

**Customer to Bill:** Not applicable unless Billable / Passthrough is set to Yes.

[/SPLIT]`,
      images: [
        { file: 'ap-47-08894cb7.png', caption: 'Quantum Technology Systems invoice — PO #189; Lines 1–3: ZetaFrame racks & PDUs; Tax: $222,923.07; Total: $3,009,461.40' },
        { file: 'ap-48-148a8ac1.png', caption: 'Line 1 — Chatsworth ZetaFrame rack (TSZ1070121); 289 units at $3,948.97; Account 15100 Racks; verify Part Number against invoice' },
        { file: 'ap-49-d7f74b12.png', caption: 'Line 2 — Chatsworth PDU (EA-67F7W-C); 381 units at $2,836.70; Account 15100 Racks; verify Part Number against invoice' },
        { file: 'ap-50-2a719fe2.png', caption: 'Line 4 — TAX (aggregated at header); $222,923.07; Matched PO Line: Not Matched; Account 15100 Racks — capitalise tax to asset account' },
      ],
    },
    {
      id: 'invoice-totals',
      title: 'Invoice Totals Section',
      level: 2,
      content: `The Invoice Totals section displays a summary of the invoice amounts as pre-populated by Zip (indicated by the blue star icon), including:

- **Currency** — The currency of the invoice (e.g., USD).
- **Pre-Tax Total** — The total invoice amount before taxes (e.g., $2,786,538.33).
- **Standard Tax Amount** — The total tax amount across all line items (e.g., $222,923.07).
- **Total Amount** — The total invoice amount inclusive of all taxes (e.g., USD $3,009,461.40).

Verify that the sum of all individual line items agrees with the invoice totals displayed in this section, and that these totals agree with the balance due on the PDF invoice. If Zip has pulled incorrect totals, update the relevant fields manually to ensure the amounts are accurate before submitting the invoice for approval.

[IMAGE]`,

      images: [
        { file: 'ap-51-dad1f1d6.png', caption: 'Invoice Totals Section — pre-tax total [AE], tax amount, and grand total [AF]' },
      ],
    },
    {
      id: 'create-bill',
      title: 'Creating the Bill',
      level: 2,
      content: `**Create Bill** is the final action in the AP invoice processing workflow. Clicking it finalizes the invoice in Zip and routes it through the approval workflow. Once approved by all required approvers, the bill syncs to **NetSuite** for payment disbursement.

> ⚠️ **This action cannot be easily undone.** Make sure every field has been reviewed and verified before clicking Create Bill.

### Pre-Flight Checklist

Before clicking Create Bill, confirm each of the following:

| Step | What to Check |
|---|---|
| ✅ Vendor verified | Vendor name matches the invoice PDF; vendor record exists in NetSuite |
| ✅ Payment method on file | ACH or check payment method is attached to the vendor in Zip |
| ✅ PO linked | Invoice is matched to the correct PO; amounts align |
| ✅ Header fields complete | Invoice Number, Invoice Date, Posting Date, Payment Terms, Due Date, Subsidiary, Department, FluidStack Location, and Description are all filled in correctly |
| ✅ Line items coded | Every line item has an Account, Department, Location, and Description; amortization schedules applied where required |
| ✅ Totals reconcile | Pre-Tax Total, Tax Amount, and Total Amount all match the vendor PDF |

### How to Create the Bill

Once all items above are confirmed:

1. Scroll to the **top right-hand corner** of the Invoice Detail screen
2. Click the **Create Bill** button
3. Zip will confirm the bill has been created and the invoice will move out of your inbox

### What Happens Next

After Create Bill is clicked:

- The invoice enters the **approval workflow** configured for the subsidiary and expense type
- Approvers are notified automatically by Zip
- Once all approvals are received, the bill syncs to **NetSuite** and is scheduled for payment
- You can track the invoice status from the **Pay → Bills** section in Zip

> 💡 **Tip:** If an invoice is sent back to you after Create Bill (e.g., an approver requests changes), you will receive a notification in Zip. Review the approver's comments, make the necessary corrections, and resubmit.`,
    },
    {
      id: 'appendix-intro',
      title: 'Appendix',
      level: 1,
      content: `Reference guide for vendor setup and other administrative procedures in NetSuite.`,
      images: [],
    },
    {
      id: 'appendix',
      title: 'Appendix A — How to Add a New Vendor into NetSuite',
      level: 1,
      hideTitle: true,
      content: `### How to Add a New Vendor into NetSuite

**Step 1:** Go into NetSuite and at the top row click on vendor → lists → vendors → new

[IMAGE]

**Step 2:** Fill in the Company name and primary subsidiary — reference the invoice for this information to be inputted.

[IMAGE]

**Step 3:** For the primary subsidiary — click the down arrow and then "list" → all of them will show up as Fluidstack US TopCo Inc. You then will have to keep looking to the right to find the specific subsidiary you are looking for — in this example "Fluidstack Inc. – USD" as seen below. Once you click on that — it will show up as Fluidstack Inc — USD within the vendor profile.

[IMAGE]

[IMAGE]

**Step 4:** Scroll down and press on the address tab → press edit and type in the address. Reference the invoice for the address. An example of what a filled in address should look like — information was taken from invoice.

[IMAGE]

[IMAGE]

**Step 5:** For UK vendors, there is no tax requirement so no W-9 is necessary. For a US entity — we need to receive the W-9 and input the tax registration number into NetSuite for the new vendor setup. The vendor can upload it themselves (in Zip) — it's their own portal.

Within NetSuite for a US vendor — go to "communication" tab at the bottom and attach the W-9.

[IMAGE]

**Step 6:** You will need to save the W-9 to your desktop. Press the "+" to attach the file.

[IMAGE]

**Step 7:** Type in the file name — in this example we are uploading a W-9 so put the company and then W-9. Then under the select file section, click on choose file and then click on the file you saved to your desktop.

[IMAGE]

**Step 8:** This is what the Communication section should look like once you upload your file. You will be able to click into the attached file to see the W-9.

[IMAGE]

**Step 9:** Then go to the financial tab and under "tax information" section — you will see "Tax ID", this is where you will put in the tax registration number that you see on the W-9.

[IMAGE]`,
    
      images: [
        { file: 'ap-52-7eebc0d1.png', caption: 'NetSuite — New Vendor setup: navigate to Vendors list' },
        { file: 'ap-53-c2a49a63.png', caption: 'NetSuite — Fill in Company name and primary subsidiary' },
        { file: 'ap-54-3a55a16d.png', caption: 'NetSuite — Select the correct subsidiary (e.g., Fluidstack Inc. – USD)' },
        { file: 'ap-55-060b65d2.png', caption: 'NetSuite — Subsidiary confirmed in vendor profile' },
        { file: 'ap-56-a502be18.png', caption: 'NetSuite — Address tab: enter vendor address from invoice' },
        { file: 'ap-57-6db3b5f0.png', caption: 'NetSuite — Completed vendor address example' },
        { file: 'ap-58-2276a192.png', caption: 'NetSuite — Communication tab: attach W-9 for US vendor' },
        { file: 'ap-59-43e98945.png', caption: 'NetSuite — Click + to attach W-9 file' },
        { file: 'ap-60-f1472e9d.png', caption: 'NetSuite — Name the file and select from desktop' },
        { file: 'ap-61-49c076b1.png', caption: 'NetSuite — Communication section with uploaded W-9' },
        { file: 'ap-62-e700821c.png', caption: 'NetSuite — Tax Information tab: enter Tax ID from W-9' },
      ],
    },
  ],
}

export const ZIP_GUIDES: Guide[] = [poGuide, apGuide]
