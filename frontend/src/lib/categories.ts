export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: "revenue-cycle-management", label: "Revenue Cycle Management" },
  { id: "contracting-strategy-yield", label: "Contracting Strategy & Yield" },
  { id: "supply-chain-pharmacy", label: "Supply Chain & Pharmacy" },
  { id: "care-model-operations", label: "Care Model Operations" },
  { id: "clinical-decision-support", label: "Clinical Decision Support & Prevision" },
  { id: "patient-engagement", label: "Patient Engagement" },
  { id: "clinical-applications", label: "Clinical Applications" },
];
