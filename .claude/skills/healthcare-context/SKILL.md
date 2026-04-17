---
name: healthcare-context
description: Healthcare technology market context, buyer personas, analyst sources, and feature hints — load when the product is in healthcare
user-invocable: false
---

# Healthcare Technology Context

Load this skill when the product involves: hospitals, health systems, EHR, EMR, patients, clinical workflows, payers, providers, revenue cycle, pharmacy, care management, scheduling, or any other healthcare domain.

---

## Healthcare Buyer Personas

| Role | Focus | Typical Product Categories |
|---|---|---|
| VP Patient Access / Director Patient Experience | Scheduling, access, contact center | Patient scheduling, access management |
| Chief Revenue Officer / VP Revenue Cycle | Billing, coding, denial management | RCM, coding, eligibility |
| Chief Medical Officer / VP Medical Affairs | Clinical workflows, quality | Clinical decision support, care management |
| Chief Information Officer / VP IT | Integration, infrastructure, security | EHR-adjacent tools, interoperability |
| VP Supply Chain / Pharmacy Director | Supply, drug management | Supply chain, pharmacy management |
| Director Population Health | Risk, outcomes, quality metrics | Population health, care model ops |
| CFO / VP Finance | Cost, yield, contracting | Contracting strategy, RCM |

**Enterprise signals in healthcare:** "health system", "IDN" (integrated delivery network), "academic medical center", "200+ beds", "multi-site", "regional health"

**Mid-market signals:** "community hospital", "specialty practice", "independent physician group", "50–200 beds"

---

## Healthcare Analyst Sources
When researching healthcare technology competitors, prioritize these sources:
- **KLAS Research** (klasresearch.com) — the primary analyst for healthcare IT; check for KLAS scores and reports
- **Black Book Research** — secondary healthcare IT analyst
- **KLAS Arch Collaborative** — patient engagement and EHR user experience
- **Advisory Board** — strategy and operations
- **Gartner** — enterprise software with healthcare verticals
- G2 and Capterra have healthcare categories but KLAS is more authoritative for enterprise health systems

---

## EHR Integration Depth (Critical Differentiator)
In healthcare, "has EHR integration" is not enough. Always specify:
- **Native / Epic-certified**: App Orchard certified, direct API integration, real-time bidirectional
- **Read-only**: can pull data from EHR (e.g., scheduling slots, patient demographics) but cannot write back
- **Read-write**: bidirectional sync, can update EHR records in real time
- **HL7/FHIR**: standards-based integration (more interoperable)
- **RPA / screen-scraping**: brittle, not supported by Epic/Cerner, a significant red flag
- **Interface engine** (Mirth, Rhapsody, Iguana): middleware-based, slower and more fragile than direct API

Score integrations as `"Partial"` if they use RPA/screen-scraping or require significant implementation services.

---

## Healthcare Regulatory & Certification Table Stakes
These are expected as baseline in enterprise healthcare — their absence is a deal-breaker:
- **HIPAA BAA** — Business Associate Agreement; required for any tool handling PHI
- **SOC 2 Type II** — security certification; expected by most health system IT/security teams
- **ONC Certification** — required for EHR vendors; relevant for clinical tools
- **FedRAMP** — required only for government/VA/DoD customers; not universal

---

## Feature Hints by Healthcare Category

### Revenue Cycle Management (RCM)
Key features: 270/271 EDI eligibility verification, claims scrubbing, denial management, prior authorization, payment posting, patient responsibility estimation, clearinghouse connectivity, contract modeling, bad debt management, AI-assisted coding, charge capture

### Contracting Strategy & Yield
Key features: payer contract modeling/simulation, rate benchmarking, underpayment detection, value-based care performance tracking, multi-payer analytics, negotiation playbook generation, contract alert management

### Supply Chain & Pharmacy
Key features: 340B program compliance, drug diversion detection, GPO contract management, controlled substance tracking (DEA), formulary management, specialty pharmacy support, inventory optimization, purchase order automation

### Care Model Operations
Key features: population health risk stratification, care gap closure, SDOH screening, HEDIS/Stars measure tracking, transitional care management, utilization management, care team coordination, readmission risk alerts

### Clinical Decision Support
Key features: drug-drug/drug-allergy interaction alerts, sepsis detection, antimicrobial stewardship, clinical documentation improvement (CDI), outbreak detection, order set recommendations, real-time EHR alerts, evidence-based guidelines

### Patient Engagement
Key features: patient portal, telehealth integration, automated appointment reminders, CAHPS survey management, multilingual support, chronic disease remote monitoring, post-discharge follow-up, patient education content

### Patient Scheduling / Access
Key features: EHR integration depth (see above), autonomous/self-serve patient booking, provider-patient matching, waitlist management, multi-channel booking (web/mobile/phone/chat), referral intake and processing, staff-facing scheduling tools, scheduling analytics dashboard, patient notifications (SMS/email), smart slot optimization

---

## Healthcare Consolidation Patterns to Watch
- EHR vendors (Epic, Oracle Health, MEDITECH) expanding into adjacent modules
- Revenue cycle management platform consolidation (point solutions merging)
- Private equity rollups in RCM and patient access
- Telehealth platforms expanding into scheduling and engagement
- AI-first startups entering legacy RCM and clinical documentation spaces
