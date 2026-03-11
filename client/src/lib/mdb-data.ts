// MDB Section types and template data
// Design: Industrial Blueprint — Technical Drawing Aesthetic

export interface MdbSection {
  id: string;
  title: string;
  code: string;
  category: SectionCategory;
  description: string;
  suggestedSections?: string[]; // IDs of related sections to suggest
}

export type SectionCategory = string;

export const DEFAULT_SECTION_CATEGORIES = [
  "general",
  "materials",
  "welding",
  "ndt",
  "testing",
  "coating",
  "drawings",
  "certificates",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  general: "#3B82F6",     // blue
  materials: "#10B981",   // emerald
  welding: "#F59E0B",     // amber
  ndt: "#8B5CF6",         // violet
  testing: "#EC4899",     // pink
  coating: "#06B6D4",     // cyan
  drawings: "#F97316",    // orange
  certificates: "#6366F1" // indigo
};

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  materials: "Materials",
  welding: "Welding",
  ndt: "NDT/NDE",
  testing: "Testing",
  coating: "Coating & Paint",
  drawings: "Drawings",
  certificates: "Certificates"
};

export const ALL_SECTIONS: MdbSection[] = [
  {
    id: "itp",
    title: "Inspection & Test Plan (ITP)",
    code: "ITP",
    category: "general",
    description: "Master document listing all inspection and test activities, hold/witness/review points, and acceptance criteria.",
    suggestedSections: ["qcp"]
  },
  {
    id: "qcp",
    title: "Quality Control Plan (QCP)",
    code: "QCP",
    category: "general",
    description: "Defines quality requirements, responsibilities, and procedures for the project scope.",
  },
  {
    id: "mdb-index",
    title: "MDB Index / Table of Contents",
    code: "IDX",
    category: "general",
    description: "Master index listing all documents included in the Manufacturing Data Book with revision status."
  },
  {
    id: "mtc",
    title: "Material Test Certificates (MTC/MTR)",
    code: "MTC",
    category: "materials",
    description: "Mill test certificates per EN 10204 (3.1/3.2) documenting chemical composition and mechanical properties.",
    suggestedSections: ["mat-tab"]
  },
  {
    id: "mat-tab",
    title: "Material Tabulation / BOM",
    code: "MAT",
    category: "materials",
    description: "Bill of Materials with heat numbers, material grades, sizes, and traceability to MTCs."
  },
  {
    id: "pos-mat",
    title: "Positive Material Identification (PMI)",
    code: "PMI",
    category: "materials",
    description: "PMI test reports verifying alloy composition of installed materials matches specifications."
  },
  {
    id: "wps",
    title: "Welding Procedure Specification (WPS)",
    code: "WPS",
    category: "welding",
    description: "Approved welding procedures defining parameters, filler metals, preheat, and PWHT requirements.",
    suggestedSections: ["pqr", "wpq", "weld-map"]
  },
  {
    id: "pqr",
    title: "Procedure Qualification Record (PQR)",
    code: "PQR",
    category: "welding",
    description: "Test records qualifying the welding procedures per applicable code (ASME IX, EN ISO 15614).",
    suggestedSections: ["wps"]
  },
  {
    id: "wpq",
    title: "Welder Performance Qualification (WPQ)",
    code: "WPQ",
    category: "welding",
    description: "Welder qualification certificates demonstrating skill per applicable code requirements.",
    suggestedSections: ["wps"]
  },
  {
    id: "weld-map",
    title: "Weld Map / Weld Log",
    code: "WLD",
    category: "welding",
    description: "Drawing-based map identifying all weld joints with welder ID, WPS reference, and NDE requirements."
  },
  {
    id: "rt",
    title: "Radiographic Testing (RT) Reports",
    code: "RT",
    category: "ndt",
    description: "Radiographic examination reports with film/digital image references and acceptance evaluation."
  },
  {
    id: "ut",
    title: "Ultrasonic Testing (UT) Reports",
    code: "UT",
    category: "ndt",
    description: "Ultrasonic examination reports for weld and base material inspection."
  },
  {
    id: "mpi",
    title: "Magnetic Particle Inspection (MPI/MT)",
    code: "MPI",
    category: "ndt",
    description: "Magnetic particle testing reports for surface and near-surface defect detection."
  },
  {
    id: "pt",
    title: "Penetrant Testing (PT) Reports",
    code: "PT",
    category: "ndt",
    description: "Liquid penetrant testing reports for surface-breaking defect detection."
  },
  {
    id: "ndt-proc",
    title: "NDE Procedures",
    code: "NDP",
    category: "ndt",
    description: "Written NDE procedures per applicable standards (ASME V, EN ISO 17635).",
    suggestedSections: ["ndt-qual"]
  },
  {
    id: "ndt-qual",
    title: "NDE Personnel Qualifications",
    code: "NDQ",
    category: "ndt",
    description: "Certificates of NDE personnel per SNT-TC-1A, EN ISO 9712, or PCN."
  },
  {
    id: "hydro",
    title: "Hydrostatic / Pressure Test Report",
    code: "HYD",
    category: "testing",
    description: "Pressure test reports with test medium, pressure, duration, and acceptance criteria."
  },
  {
    id: "leak",
    title: "Leak Test Report",
    code: "LTR",
    category: "testing",
    description: "Pneumatic or helium leak test reports with test parameters and results."
  },
  {
    id: "hardness",
    title: "Hardness Test Reports",
    code: "HRD",
    category: "testing",
    description: "Production hardness test results for base material and welds."
  },
  {
    id: "impact",
    title: "Impact / Charpy Test Reports",
    code: "IMP",
    category: "testing",
    description: "Charpy V-notch impact test results at specified temperatures."
  },
  {
    id: "pwht",
    title: "Post Weld Heat Treatment (PWHT)",
    code: "PHT",
    category: "testing",
    description: "PWHT time-temperature charts and reports for stress relief or tempering.",
    suggestedSections: ["wps"]
  },
  {
    id: "dim",
    title: "Dimensional Inspection Report",
    code: "DIM",
    category: "testing",
    description: "Dimensional check reports verifying fabricated items meet drawing tolerances."
  },
  {
    id: "paint",
    title: "Coating / Paint Inspection Report",
    code: "PNT",
    category: "coating",
    description: "Surface preparation and coating application reports with DFT measurements.",
    suggestedSections: ["paint-proc"]
  },
  {
    id: "paint-proc",
    title: "Coating Procedure / Specification",
    code: "CPS",
    category: "coating",
    description: "Coating system specification with surface prep, primer, intermediate, and topcoat details."
  },
  {
    id: "as-built",
    title: "As-Built Drawings",
    code: "ABD",
    category: "drawings",
    description: "Final drawings reflecting the actual as-fabricated/installed configuration."
  },
  {
    id: "ga-dwg",
    title: "General Arrangement Drawings",
    code: "GAD",
    category: "drawings",
    description: "Overall layout and arrangement drawings showing equipment positioning and interfaces."
  },
  {
    id: "nameplate",
    title: "Nameplate Data / Facsimile",
    code: "NPD",
    category: "certificates",
    description: "Equipment nameplate information including design conditions, serial numbers, and code stamps."
  },
  {
    id: "asme-dr",
    title: "ASME Data Report (U-1/U-1A)",
    code: "ADR",
    category: "certificates",
    description: "Manufacturer's Data Report as required by ASME Boiler & Pressure Vessel Code."
  },
  {
    id: "ped-doc",
    title: "PED / CE Documentation",
    code: "PED",
    category: "certificates",
    description: "Pressure Equipment Directive documentation including Declaration of Conformity."
  },
  {
    id: "ncr",
    title: "Non-Conformity Reports (NCR)",
    code: "NCR",
    category: "certificates",
    description: "Documentation of deviations from specifications with disposition and corrective actions."
  },
  {
    id: "cal-cert",
    title: "Calibration Certificates",
    code: "CAL",
    category: "certificates",
    description: "Calibration records for inspection and test equipment used during fabrication."
  },
  {
    id: "third-party",
    title: "Third-Party Inspection Certificates",
    code: "TPI",
    category: "certificates",
    description: "Inspection reports and release notes from third-party inspection bodies (Lloyd's, TÜV, Bureau Veritas, etc.)."
  }
];

export interface SectorTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  sectionIds: string[];
}

export const SECTOR_TEMPLATES: SectorTemplate[] = [
  {
    id: "pressure-vessels",
    name: "Pressure Vessels (ASME)",
    icon: "🔧",
    description: "Complete MDB for ASME coded pressure vessels including U-1 data reports.",
    sectionIds: ["mdb-index", "itp", "qcp", "mtc", "mat-tab", "wps", "pqr", "wpq", "weld-map", "rt", "ut", "mpi", "hydro", "hardness", "pwht", "dim", "paint", "as-built", "nameplate", "asme-dr", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "offshore",
    name: "Offshore Structures",
    icon: "🌊",
    description: "MDB for offshore structural steel and piping per NORSOK / DNV standards.",
    sectionIds: ["mdb-index", "itp", "qcp", "mtc", "mat-tab", "pos-mat", "wps", "pqr", "wpq", "weld-map", "rt", "ut", "mpi", "pt", "ndt-proc", "ndt-qual", "hydro", "hardness", "impact", "pwht", "dim", "paint", "paint-proc", "as-built", "ga-dwg", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "piping",
    name: "Process Piping",
    icon: "🔩",
    description: "MDB for process piping systems per ASME B31.3 or EN 13480.",
    sectionIds: ["mdb-index", "itp", "mtc", "mat-tab", "pos-mat", "wps", "pqr", "wpq", "weld-map", "rt", "ut", "pt", "hydro", "leak", "pwht", "dim", "paint", "as-built", "ncr", "cal-cert"]
  },
  {
    id: "heat-exchangers",
    name: "Heat Exchangers (TEMA)",
    icon: "🔥",
    description: "MDB for shell & tube heat exchangers per ASME VIII / TEMA standards.",
    sectionIds: ["mdb-index", "itp", "qcp", "mtc", "mat-tab", "wps", "pqr", "wpq", "weld-map", "rt", "ut", "hydro", "hardness", "pwht", "dim", "paint", "as-built", "nameplate", "asme-dr", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "storage-tanks",
    name: "Storage Tanks (API 650)",
    icon: "🛢️",
    description: "MDB for atmospheric storage tanks per API 650 / EN 14015.",
    sectionIds: ["mdb-index", "itp", "mtc", "mat-tab", "wps", "pqr", "wpq", "weld-map", "rt", "mpi", "hydro", "dim", "paint", "paint-proc", "as-built", "nameplate", "ncr", "cal-cert"]
  },
  {
    id: "ped-equipment",
    name: "PED Equipment (EU)",
    icon: "🇪🇺",
    description: "MDB for pressure equipment under the European Pressure Equipment Directive 2014/68/EU.",
    sectionIds: ["mdb-index", "itp", "qcp", "mtc", "mat-tab", "wps", "pqr", "wpq", "weld-map", "rt", "ut", "hydro", "hardness", "impact", "pwht", "dim", "paint", "as-built", "nameplate", "ped-doc", "ncr", "cal-cert", "third-party"]
  }
];

export interface ProjectInfo {
  projectName: string;
  documentNumber: string;
  revision: string;
  clientName: string;
  date: string;
}

export interface MdbProject {
  info: ProjectInfo;
  sections: MdbSection[];
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
