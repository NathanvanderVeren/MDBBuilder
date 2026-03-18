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
  "engineering",
  "datasheets",
  "materials",
  "welding",
  "heattreatment",
  "ndt",
  "hydrotesting",
  "testing",
  "coating",
  "valves",
  "instruments",
  "certificates",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  general: "#14B8A6",     // teal
  engineering: "#2563EB", // blue-600
  datasheets: "#0EA5E9",  // sky
  materials: "#10B981",   // emerald
  welding: "#F59E0B",     // amber
  heattreatment: "#DC2626", // red-600
  ndt: "#8B5CF6",         // violet
  hydrotesting: "#0284C7", // light blue
  testing: "#EC4899",     // pink
  coating: "#06B6D4",     // cyan
  valves: "#F97316",      // orange
  instruments: "#14B8A6", // teal
  certificates: "#6366F1" // indigo
};

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  engineering: "Engineering",
  datasheets: "Data Sheets",
  materials: "Materials",
  welding: "Welding",
  heattreatment: "Heat Treatment",
  ndt: "NDT/NDE",
  hydrotesting: "Hydrostatic Testing",
  testing: "Testing",
  coating: "Coating & Paint",
  valves: "Valves",
  instruments: "Instruments",
  certificates: "Certificates"
};

export const ALL_SECTIONS: MdbSection[] = [
  {
    id: "itp",
    title: "Inspection & Test Plan (ITP)",
    code: "ITP",
    category: "general",
    description: "Master document listing all inspection and test activities, hold/witness/review points, and acceptance criteria.",
    suggestedSections: ["doc-schedule", "project-planning"]
  },
  {
    id: "mdb-index",
    title: "MDB Index / Table of Contents",
    code: "IDX",
    category: "general",
    description: "Master index listing all documents included in the Manufacturing Data Book with revision status."
  },
  {
    id: "doc-schedule",
    title: "Document Schedule",
    code: "DCS",
    category: "general",
    description: "Planned submission schedule listing each deliverable, revision, and required issue dates."
  },
  {
    id: "project-planning",
    title: "Project Planning",
    code: "PLN",
    category: "general",
    description: "Project planning package covering milestones, fabrication sequence, and key interfaces."
  },
  {
    id: "process-description",
    title: "Process Description",
    code: "PRD",
    category: "general",
    description: "Narrative describing process intent, system boundaries, and operational philosophy."
  },
  {
    id: "cause-effect",
    title: "Cause & Effect Diagram",
    code: "CED",
    category: "general",
    description: "Cause and effect matrix linking alarms/trips to control system actions and final elements."
  },
  {
    id: "control-narratives",
    title: "Control Narratives",
    code: "CTN",
    category: "general",
    description: "Detailed narratives defining control loops, permissives, interlocks, and start-up/shutdown logic."
  },
  {
    id: "spare-parts",
    title: "Spare Parts List",
    code: "SPL",
    category: "general",
    description: "Recommended commissioning and operational spares with quantities, part numbers, and lead times."
  },
  {
    id: "iom-manual",
    title: "Installation, Operation & Maintenance Manual",
    code: "IOM",
    category: "general",
    description: "Manual covering installation instructions, operating limits, and routine maintenance requirements."
  },
  {
    id: "ga-dwg",
    title: "General Arrangement Drawing",
    code: "GAD",
    category: "engineering",
    description: "Overall layout drawing showing principal dimensions, interfaces, and equipment orientation."
  },
  {
    id: "detail-dwg",
    title: "Detail Drawing",
    code: "DDW",
    category: "engineering",
    description: "Detail fabrication drawings with dimensions, tolerances, weld symbols, and notes."
  },
  {
    id: "pid-dwg",
    title: "P&ID Drawing",
    code: "PID",
    category: "engineering",
    description: "Piping and instrumentation diagrams defining process lines, instruments, and control functions."
  },
  {
    id: "iso-metric-dwg",
    title: "ISO Metric Drawings",
    code: "ISO",
    category: "engineering",
    description: "Isometric style piping/fabrication drawings including spool dimensions and support references."
  },
  {
    id: "strength-calc",
    title: "Strength Calculations",
    code: "STC",
    category: "engineering",
    description: "Design calculations verifying structural integrity, allowable stresses, and code compliance."
  },
  {
    id: "as-built",
    title: "As-Built Drawings",
    code: "ABD",
    category: "engineering",
    description: "Final drawings reflecting the actual as-fabricated/installed configuration."
  },
  {
    id: "valve-ds",
    title: "Valve Data Sheets",
    code: "VDS",
    category: "datasheets",
    description: "Data sheets defining valve service conditions, design ratings, materials, and accessories."
  },
  {
    id: "instrument-ds",
    title: "Instrument Data Sheets",
    code: "IDS",
    category: "datasheets",
    description: "Instrument specification sheets with process ranges, accuracy class, and communication protocol."
  },
  {
    id: "equipment-ds",
    title: "Equipment Data Sheets",
    code: "EDS",
    category: "datasheets",
    description: "Mechanical equipment data sheets covering duty point, design conditions, and material classes."
  },
  {
    id: "motor-ds",
    title: "Motor Data Sheets",
    code: "MDS",
    category: "datasheets",
    description: "Motor and drive data sheets with ratings, enclosure class, and electrical characteristics."
  },
  {
    id: "mat-tab",
    title: "Bill of Materials",
    code: "BOM",
    category: "materials",
    description: "Bill of Materials with heat numbers, material grades, sizes, and traceability to MTCs."
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
    id: "preheat-proc",
    title: "Pre Heat Procedure",
    code: "PHP",
    category: "heattreatment",
    description: "Procedure defining preheat temperatures, soak requirements, heating methods, and monitoring controls."
  },
  {
    id: "preheat-report",
    title: "Pre Heat Reports",
    code: "PHR",
    category: "heattreatment",
    description: "Execution records documenting achieved preheat temperatures, hold times, and monitored locations."
  },
  {
    id: "pwht-proc",
    title: "PWHT Procedure",
    code: "PWP",
    category: "heattreatment",
    description: "Approved PWHT procedure including temperature ramp rates, soak times, cooling limits, and acceptance criteria."
  },
  {
    id: "pwht",
    title: "PWHT Report",
    code: "PHT",
    category: "heattreatment",
    description: "PWHT execution report with time-temperature charts, cycle parameters, and final acceptance results.",
    suggestedSections: ["pwht-proc", "thermocouple-cert"]
  },
  {
    id: "thermocouple-cert",
    title: "Thermocouple Certificates",
    code: "TCC",
    category: "heattreatment",
    description: "Calibration and conformity certificates for thermocouples, data loggers, and heat treatment control equipment."
  },
  {
    id: "ht-chart",
    title: "Heat Treatment Charts",
    code: "HTC",
    category: "heattreatment",
    description: "Recorded heat treatment charts providing traceable cycle evidence for each weld/component."
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
    id: "vt",
    title: "Visual Testing (VT) Reports",
    code: "VT",
    category: "ndt",
    description: "Visual examination records covering weld profile, surface condition, and workmanship acceptance."
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
    id: "hydro-proc",
    title: "Hydrostatic Testing Procedure",
    code: "HTP",
    category: "hydrotesting",
    description: "Approved test procedure defining pressure levels, hold durations, venting, and safety controls."
  },
  {
    id: "hydro",
    title: "Hydrostatic Testing Report",
    code: "HYD",
    category: "hydrotesting",
    description: "Executed hydrotest record with test pressure, hold time, leak checks, and acceptance status."
  },
  {
    id: "hydro-cal-cert",
    title: "Hydrotest Calibration Certificates",
    code: "HCC",
    category: "hydrotesting",
    description: "Calibration certificates for pressure gauges, recorders, and test instrumentation used during hydrotesting."
  },
  {
    id: "water-cert",
    title: "Water Quality Certificate",
    code: "WQC",
    category: "hydrotesting",
    description: "Certificate confirming test water chloride content and quality meet project/code limits."
  },
  {
    id: "hydro-log",
    title: "Hydrostatic Test Log & Punch List",
    code: "HTL",
    category: "hydrotesting",
    description: "Consolidated hydrotest log with punch items, retest actions, and closeout status."
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
    id: "valve-index",
    title: "Valve Index / Valve List",
    code: "VLI",
    category: "valves",
    description: "Master valve register including tag numbers, line service, type, class, and actuation method."
  },
  {
    id: "valve-sizing",
    title: "Valve Sizing Calculations",
    code: "VSC",
    category: "valves",
    description: "Sizing calculations for control and relief valves based on process flow conditions and code rules."
  },
  {
    id: "valve-inspection",
    title: "Valve Inspection & Test Reports",
    code: "VTR",
    category: "valves",
    description: "Incoming and final inspection/test records for valves including seat/leak and functional checks."
  },
  {
    id: "valve-actuator",
    title: "Valve Actuator Settings",
    code: "VAS",
    category: "valves",
    description: "Actuator calibration, travel setting, and fail-safe configuration records for actuated valves."
  },
  {
    id: "instr-index",
    title: "Instrument Index",
    code: "IIN",
    category: "instruments",
    description: "Tag index of all instruments including service, location, and control system I/O reference."
  },
  {
    id: "loop-diagram",
    title: "Instrument Loop Diagrams",
    code: "ILD",
    category: "instruments",
    description: "Loop diagrams showing wiring, terminations, and functional signal paths from field to control system."
  },
  {
    id: "instrument-cal",
    title: "Instrument Calibration Reports",
    code: "ICR",
    category: "instruments",
    description: "Calibration and as-left/as-found records for process instruments used in operation and safety functions."
  },
  {
    id: "instrument-hookup",
    title: "Instrument Hook-Up Details",
    code: "IHD",
    category: "instruments",
    description: "Standard and project-specific hook-up details for instrument mounting, tubing, and cabling."
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
    category: "hydrotesting",
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
    sectionIds: ["mdb-index", "itp", "doc-schedule", "project-planning", "mtc", "mat-tab", "ga-dwg", "detail-dwg", "strength-calc", "wps", "pqr", "wpq", "weld-map", "preheat-proc", "preheat-report", "pwht-proc", "pwht", "thermocouple-cert", "ht-chart", "rt", "ut", "mpi", "vt", "hydro-proc", "hydro", "water-cert", "hardness", "dim", "paint", "as-built", "nameplate", "asme-dr", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "offshore",
    name: "Offshore Structures",
    icon: "🌊",
    description: "MDB for offshore structural steel and piping per NORSOK / DNV standards.",
    sectionIds: ["mdb-index", "itp", "doc-schedule", "mtc", "mat-tab", "pos-mat", "ga-dwg", "detail-dwg", "strength-calc", "wps", "pqr", "wpq", "weld-map", "preheat-proc", "preheat-report", "pwht-proc", "pwht", "thermocouple-cert", "ht-chart", "rt", "ut", "mpi", "pt", "vt", "ndt-proc", "ndt-qual", "hydro-proc", "hydro", "water-cert", "hardness", "impact", "dim", "paint", "paint-proc", "as-built", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "piping",
    name: "Process Piping",
    icon: "🔩",
    description: "MDB for process piping systems per ASME B31.3 or EN 13480.",
    sectionIds: ["mdb-index", "itp", "process-description", "mtc", "mat-tab", "pos-mat", "pid-dwg", "iso-metric-dwg", "ga-dwg", "wps", "pqr", "wpq", "weld-map", "preheat-proc", "pwht-proc", "pwht", "thermocouple-cert", "rt", "ut", "pt", "vt", "hydro-proc", "hydro", "water-cert", "leak", "dim", "paint", "as-built", "valve-ds", "instrument-ds", "ncr", "cal-cert"]
  },
  {
    id: "heat-exchangers",
    name: "Heat Exchangers (TEMA)",
    icon: "🔥",
    description: "MDB for shell & tube heat exchangers per ASME VIII / TEMA standards.",
    sectionIds: ["mdb-index", "itp", "doc-schedule", "process-description", "mtc", "mat-tab", "ga-dwg", "detail-dwg", "strength-calc", "wps", "pqr", "wpq", "weld-map", "preheat-proc", "preheat-report", "pwht-proc", "pwht", "thermocouple-cert", "ht-chart", "rt", "ut", "vt", "hydro-proc", "hydro", "water-cert", "hardness", "dim", "paint", "as-built", "nameplate", "asme-dr", "ncr", "cal-cert", "third-party"]
  },
  {
    id: "storage-tanks",
    name: "Storage Tanks (API 650)",
    icon: "🛢️",
    description: "MDB for atmospheric storage tanks per API 650 / EN 14015.",
    sectionIds: ["mdb-index", "itp", "doc-schedule", "mtc", "mat-tab", "ga-dwg", "detail-dwg", "wps", "pqr", "wpq", "weld-map", "rt", "mpi", "vt", "hydro-proc", "hydro", "water-cert", "dim", "paint", "paint-proc", "as-built", "nameplate", "ncr", "cal-cert"]
  },
  {
    id: "ped-equipment",
    name: "PED Equipment (EU)",
    icon: "🇪🇺",
    description: "MDB for pressure equipment under the European Pressure Equipment Directive 2014/68/EU.",
    sectionIds: ["mdb-index", "itp", "doc-schedule", "process-description", "mtc", "mat-tab", "ga-dwg", "detail-dwg", "strength-calc", "wps", "pqr", "wpq", "weld-map", "preheat-proc", "preheat-report", "pwht-proc", "pwht", "thermocouple-cert", "ht-chart", "rt", "ut", "vt", "hydro-proc", "hydro", "water-cert", "hardness", "impact", "dim", "paint", "as-built", "nameplate", "ped-doc", "ncr", "cal-cert", "third-party"]
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
