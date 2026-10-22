export type Tone = "blue" | "amber" | "green" | "rose" | "neutral";

export interface Action { id: string; label: string; primary?: boolean }
export interface BriefingItem {
  id: string;
  entity: string;
  title: string;
  recommendation: string;
  context: string;
  whyNow: string;
  expectedOutcome: string;
  riskOfInaction: string;
  impactScore: number;
  confidenceScore: number;
  actions: Action[];
  tone?: Tone;
  badge?: string;
  value?: string;
}

export interface Briefing {
  generatedAt: string;
  status: string;
  nextBestAction: BriefingItem;
  executeNow: BriefingItem[];
  decisionsRequired: BriefingItem[];
  atRisk: BriefingItem[];
  waiting: BriefingItem[];
  opportunities: BriefingItem[];
  relationshipRepairs: BriefingItem[];
  reviewQueue: BriefingItem[];
}

export const sampleBriefing: Briefing = {
  generatedAt: "2026-10-21T08:30:00-04:00",
  status: "Illustrative sample",
  nextBestAction: {
    id: "ga-power",
    entity: "Georgia Power",
    title: "Contact Georgia Power",
    recommendation: "Transfer utility service before the move.",
    context: "Move date is six days away and no transfer request is detected.",
    whyNow: "The normal processing window is closing.",
    expectedOutcome: "Utilities active before move-in, with no interruption or late setup fee.",
    riskOfInaction: "Service may not be active when you arrive.",
    impactScore: 92,
    confidenceScore: 88,
    tone: "blue",
    badge: "High impact",
    actions: [
      { id: "call", label: "Call now", primary: true },
      { id: "online", label: "Start online" },
      { id: "more", label: "More" }
    ]
  },
  executeNow: [{
    id: "registration",
    entity: "Primary Vehicle",
    title: "Renew vehicle registration",
    recommendation: "Complete the online renewal today.",
    context: "Expires in four days.",
    whyNow: "Renewal is available and requires no further decision.",
    expectedOutcome: "Registration remains active without penalty.",
    riskOfInaction: "Late fee and possible lapse.",
    impactScore: 84,
    confidenceScore: 97,
    tone: "neutral",
    actions: [{ id: "complete", label: "Complete", primary: true }]
  }],
  decisionsRequired: [{
    id: "insurance",
    entity: "Health Coverage",
    title: "Choose insurance plan",
    recommendation: "Select the PPO option.",
    context: "Enrollment closes in 12 days.",
    whyNow: "The remaining window should be used to verify providers and authorize enrollment.",
    expectedOutcome: "Flexible coverage with more predictable out-of-network access.",
    riskOfInaction: "Default enrollment may preserve the current plan at a higher expected cost.",
    impactScore: 91,
    confidenceScore: 82,
    tone: "blue",
    actions: [{ id: "review", label: "Review options" }]
  }],
  atRisk: [{
    id: "escrow",
    entity: "Home Mortgage",
    title: "Mortgage escrow shortfall",
    recommendation: "Review the escrow analysis and contact the servicer.",
    context: "Projected payment increase: $172 per month.",
    whyNow: "The adjustment is scheduled for the next statement cycle.",
    expectedOutcome: "Verify the calculation and choose the least disruptive resolution.",
    riskOfInaction: "The higher payment may take effect without review.",
    impactScore: 96,
    confidenceScore: 94,
    tone: "amber",
    badge: "1 critical",
    actions: [{ id: "review", label: "Review" }, { id: "contact", label: "Contact servicer" }]
  }],
  waiting: [{
    id: "contract",
    entity: "Vendor Agreement",
    title: "Contract signature",
    recommendation: "Hold until Friday, then follow up if unsigned.",
    context: "Waiting on vendor.",
    whyNow: "Expected response is within three days.",
    expectedOutcome: "Avoid unnecessary follow-up while preserving the schedule.",
    riskOfInaction: "No current risk unless Friday passes without a response.",
    impactScore: 72,
    confidenceScore: 86,
    tone: "neutral",
    actions: [{ id: "details", label: "View details" }]
  }],
  opportunities: [{
    id: "refinance",
    entity: "Auto Loan",
    title: "Refinance auto loan",
    recommendation: "Compare three prequalified offers.",
    context: "Current rate is above available estimates.",
    whyNow: "The estimated rate window may reduce annual interest expense.",
    expectedOutcome: "Potential savings of $1,840 annually.",
    riskOfInaction: "Continue paying the current higher rate.",
    impactScore: 88,
    confidenceScore: 77,
    tone: "green",
    value: "$1,840 / year",
    actions: [{ id: "explore", label: "Explore" }]
  }],
  relationshipRepairs: [{
    id: "sarah",
    entity: "Sarah Johnson",
    title: "Reconnect with Sarah",
    recommendation: "Schedule a 20-minute catch-up call next week.",
    context: "No communication in 42 days.",
    whyNow: "The relationship is important and a promised follow-up remains open.",
    expectedOutcome: "Restore communication and close the outstanding commitment.",
    riskOfInaction: "The relationship may continue to drift.",
    impactScore: 86,
    confidenceScore: 81,
    tone: "rose",
    actions: [{ id: "schedule", label: "Schedule" }]
  }],
  reviewQueue: [
    {
      id: "tax",
      entity: "2026 Taxes",
      title: "Review tax return draft",
      recommendation: "Reserve 25 minutes for review.",
      context: "Due next week.",
      whyNow: "There is adequate time, but supporting questions may need follow-up.",
      expectedOutcome: "Approve or return the draft with changes.",
      riskOfInaction: "Filing may be delayed.",
      impactScore: 79,
      confidenceScore: 95,
      actions: [{ id: "review", label: "Review" }]
    },
    {
      id: "estate",
      entity: "Estate Plan",
      title: "Review estate planning documents",
      recommendation: "Confirm beneficiaries and instructions.",
      context: "Last reviewed 18 months ago.",
      whyNow: "A routine review is overdue.",
      expectedOutcome: "Keep instructions current.",
      riskOfInaction: "Outdated instructions may remain in force.",
      impactScore: 76,
      confidenceScore: 89,
      actions: [{ id: "review", label: "Review" }]
    },
    {
      id: "fund",
      entity: "Emergency Fund",
      title: "Review emergency fund allocation",
      recommendation: "Compare the balance with current obligations.",
      context: "No recent review.",
      whyNow: "Housing and insurance costs have changed.",
      expectedOutcome: "Confirm an appropriate reserve target.",
      riskOfInaction: "The reserve may no longer match current exposure.",
      impactScore: 74,
      confidenceScore: 84,
      actions: [{ id: "review", label: "Review" }]
    }
  ]
};
