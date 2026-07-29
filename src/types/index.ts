export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'OPERATION_MANAGER'
  | 'HOFO'
  | 'AREA_SUPERVISOR'
  | 'SUPERVISOR'
  | 'OUTLET_ADMIN'
  | 'STAFF'
  | 'AUDIT'

export interface OutletRole {
  outletId: string
  role: UserRole
}


export interface User {
  id: string
  username?: string
  name: string
  phone?: string
  address?: string
  email?: string
  role?: string | UserRole
  area?: string
  areaId?: string | null
  avatarUrl?: string
  avatar?: string
  passwordHash?: string
  isActive?: boolean
  createdAt?: string
  status?: string
  joinDate?: string
  outlets?: string[]
  companyRoles?: UserRole[]
  outletRoles?: OutletRole[]
}

export interface Depot {
  id: string
  name: string
}

export interface MeResponse {
  user: User
  kontakSpvArea?: {
    phone: string
  }
  depots: Depot[]
}

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

// Visit related types
export interface VisitSummary {
  totalVisit: number
  completed: number
  scheduled: number
  failed: number
}

export interface VisitItem {
  id: string
  time: string
  depotName: string
  address: string
  imageUrl: string
  status: string
  statusCode: 'completed' | 'scheduled' | 'failed'
}

export interface VisitToday {
  date: string
  items: VisitItem[]
}

export interface VisitReminder {
  date: string
  description: string
}

export interface VisitOverview {
  summary: VisitSummary
  visitsToday: VisitToday
  reminder: VisitReminder
}

export interface CalendarDay {
  dayLabel: string
  dateNum: number
  hasDot: boolean
  dotColor: string
  active: boolean
  isHoliday: boolean
}

export interface CalendarStrip {
  rangeLabel: string
  days: CalendarDay[]
}

export interface ScheduledVisitItem {
  id: string
  time: string
  depotName: string
  address: string
  imageUrl: string
  status: string
  statusCode: 'completed' | 'scheduled' | 'failed'
}

export interface VisitScheduleResponse {
  calendarStrip: CalendarStrip
  visitsList: ScheduledVisitItem[]
  hasAddScheduleButton: boolean
}

export interface ScheduledVisit {
  id: number
  title: string
  date: string
  time: string
  location: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  assignedTo: string
}

export interface VisitHistory {
  id: number
  title: string
  date: string
  duration: string
  location: string
  status: 'Completed' | 'Cancelled'
  notes: string
}

export interface ChecklistQuestion {
  id: number
  question: string
  category: string
  isMandatory: boolean
  questionType: 'text' | 'multiple_choice' | 'yes_no' | 'rating'
  options?: string[]
}

// Master data pertanyaan checklist visit (tabel visit_checklist_question di backend).
// Beda dari ChecklistQuestion di atas (yang dipakai read-only di tab visit).
export interface AdminChecklistQuestion {
  id: string
  companyId: string
  category: string
  section: string
  question: string
  weight: number
  sortOrder: number
  isActive: boolean
  createdAt?: string
}

// Area related types
export interface Area {
  id: string
  name: string
  slug?: string
  description?: string
  spvAreaUserId?: string
  isActive?: boolean
  createdAt?: string
}

// Outlet related types
export interface Outlet {
  id: string
  companyId: string
  slug: string
  name: string
  address: string
  latitude: string | null
  longitude: string | null
  imageUrl: string
  isActive: boolean
  areaId?: string | null
  createdAt: string
}

// Insight rule types
export type InsightRuleType =
  | 'delivery_cost_over_budget'
  | 'stock_low_below_threshold'
  | 'expense_over_budget'
  | 'sales_below_target'

export type InsightSeverity = 'info' | 'warning' | 'critical'

export interface InsightRuleConfigDeliveryOverBudget {
  defaultBudgetMonthly: number
  thresholdPercent?: number
  byOutlet?: Record<string, { budgetMonthly?: number }>
}

export interface InsightRuleConfigStockLow {
  itemName: string
  minQuantity: number
}

export interface InsightRuleConfigExpenseOverBudget {
  defaultBudgetMonthly: number
  thresholdPercent?: number
  category?: string
  byOutlet?: Record<string, { budgetMonthly?: number }>
}

export interface InsightRuleConfigSalesBelowTarget {
  defaultTargetMonthly: number
  byOutlet?: Record<string, { targetMonthly?: number }>
}

export type InsightRuleConfig =
  | InsightRuleConfigDeliveryOverBudget
  | InsightRuleConfigStockLow
  | InsightRuleConfigExpenseOverBudget
  | InsightRuleConfigSalesBelowTarget

export interface InsightRule {
  id: string
  companyId: string
  ruleType: InsightRuleType
  severity: InsightSeverity
  enabled: boolean
  config: InsightRuleConfig
  titleTemplate: string
  descriptionTemplate: string
  sortOrder: number
  createdAt: string
}

// Company type
export interface Company {
  id: string
  slug: string
  name: string
  defaultGallonPrice: number
  createdAt: string
}

// Sync viewer types
export type SyncSource = 'sale' | 'delivery_cost' | 'expense' | 'stock'
export type SyncStatus = 'running' | 'success' | 'failed'
export type SyncMode = 'incremental' | 'backfill'

export interface SyncRun {
  id: string
  source: SyncSource
  mode: SyncMode
  status: SyncStatus
  recordsFetched: number
  recordsUpserted: number
  cursorBefore: string | null
  cursorAfter: string | null
  rangeFrom: string | null
  rangeTo: string | null
  jobId: string | null
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}

export interface SyncState {
  source: SyncSource
  lastCursor: string | null
  lastSyncedAt: string | null
  createdAt: string
}

// Visit Report types
export type VisitReportStatus = 'pending' | 'approved' | 'rejected'

export interface VisitReportListItem {
  id: string
  status: VisitReportStatus
  reportType: 'visit' | 'failed'
  outlet: {
    id: string
    name: string
    address: string
    imageUrl: string
  }
  visit: {
    date: string
    time: string
    datetime: string
  }
  checklist: {
    total: number
    completed: number
  }
  issues: {
    total: number
  }
  supervisor: {
    id: string
    name: string
  }
}

export interface VisitReportListResponse {
  summary: {
    total_reports: number
  }
  reports: VisitReportListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface StokBahanBakuItem {
  name: string
  quantity: number
  status: 'safe' | 'warning' | 'danger'
}

export interface ChecklistItemPhoto {
  url: string | null
  contentType: string | null
}

export interface ChecklistItem {
  id: string
  questionId: string
  question: string
  answer: boolean
  note: string | null
  weight: number
  // Only present on audit report checklist items (photo evidence per item).
  photos?: ChecklistItemPhoto[]
}

export interface ChecklistSection {
  name: string
  items: ChecklistItem[]
}

export interface ChecklistCategory {
  name: string
  sections: ChecklistSection[]
}

// Jam presensi (check-in/checkout) & durasi kunjungan. Null bila item bukan
// visit (agenda/libur) atau SPV belum check-in.
export interface VisitPresence {
  checkinAt: string | null
  checkoutAt: string | null
  durationMinutes: number | null
  isLate: boolean
  // Foto bukti presensi yang diambil SPV saat check-in (URL presigned dari API).
  // Null bila belum check-in atau presign gagal di server.
  checkinPhotoUrl: string | null
  // Idem untuk saat check-out. Null bila SPV belum check-out.
  checkoutPhotoUrl: string | null
}

export interface AdminVisitItem {
  id: string
  type: 'visit' | 'agenda' | 'libur'
  time: string | null
  endTime: string | null
  title: string | null
  note: string | null
  name: string | null
  outlet: { id: string; name: string; address: string; imageUrl: string } | null
  status: string
  statusCode: string
  statusColor: { code: string; hex: string }
  date: string
  presence: VisitPresence | null
}
export interface AdminVisitSupervisorGroup {
  id: string
  name: string
  role: string
  avatarUrl: string
  visits: AdminVisitItem[]
}
export interface AdminVisitScheduleResponse {
  startDate: string
  endDate: string
  supervisors: AdminVisitSupervisorGroup[]
}

export interface VisitReportDetail {
  id: string
  status: {
    code: string
    label: string
  }
  reportType: 'visit' | 'failed'
  // Asal laporan (F16 v1.5). Opsional karena backend lama belum mengirimnya —
  // dipakai sebagai fallback label What To Do bila `laporan.whatToDoLabel` absen.
  source?: 'spv' | 'audit'
  failedReason: string | null
  presence: VisitPresence
  outlet: {
    id: string
    name: string
    address: string
    imageUrl: string
    area: {
      id: string
      name: string
    }
  }
  visit: {
    scheduleId: string
    date: string
    displayDate: string
    time: string
    datetime: string
    submittedAt: string
  }
  summary: {
    checklist: {
      total: number
      completed: number
      score: number
    }
    issues: {
      total: number
      checklist: number
      stock: number
      delivery: number
    }
    supervisor: {
      id: string
      name: string
    }
  }
  laporan: {
    cash: {
      pettyCash: number | null
      cashDrawer: number | null
      inputSpv: number | null
      pos: number | null
      note: string | null
    }
    pengantaranGalon: {
      // Dua angka berbeda (F16 v1.5): jumlah TRANSAKSI vs jumlah GALON.
      // `null` = tidak dicatat (laporan sebelum kolom qty ada), bukan nol.
      jumlahPengantaranHariIni: number | null
      qtyPengantaranHariIni?: number | null
      kendala: string[]
      kendalaLainnya: string | null
      note: string | null
    }
    stokBahanBaku: StokBahanBakuItem[]
    kualitasAir: {
      ph: number | null
      tds: number | null
      note: string | null
    }
    whatToDo: string[]
    // Judul section per role (F16 v1.5): AUDIT "Rekomendasi Tindakan",
    // SPV "Tindakan Wajib". Strukturnya tetap satu section — tidak dipecah.
    whatToDoLabel?: string
    // Catatan auditor multi-section (audit-only, v1.4): tiap entri title + body +
    // foto (maks 3). Kosong/absen untuk SPV.
    auditNotes?: Array<{
      key: string
      title: string
      body: string
      photos: ChecklistItemPhoto[]
    }>
  }
  // Foto bukti per section laporan (audit-only). Key = nama section:
  // 'cash' | 'pengantaranGalon' | 'stokBahanBaku' | 'kualitasAir' | 'whatToDo'.
  // Kosong/absen untuk laporan SPV.
  laporanPhotos?: Record<string, ChecklistItemPhoto[]>
  approval: {
    status: string
    approvedAt: string | null
    approvedBy: { id: string; name: string } | null
    supervisor: { id: string; name: string }
    supervisorArea: { id: string; name: string } | null
    note: string
    // Balasan SPV atas `note` di atas — sekali tulis, jadi `null` berarti belum
    // pernah dibalas (bukan "dibalas dengan teks kosong"). Dashboard hanya
    // menampilkan; tidak ada jalur membalas dari sisi admin.
    reply: {
      note: string
      repliedAt: string | null
      repliedBy: { id: string; name: string } | null
    } | null
  } | null
  checklist: {
    summary: {
      total: number
      completed: number
      issues: number
    }
    categories: ChecklistCategory[]
  }
}

// Audit Report types (F03 Audit Visit)
export type AuditApprovalStatus = 'pending' | 'approved' | 'rejected' | 'submitted'

export interface AuditReportListItem {
  id: string
  outletId: string
  outletName: string
  auditorName: string
  submittedAt: string
  checklistScore: number
  approvalStatus: AuditApprovalStatus
  hasComparison: boolean
}

export interface AuditReportListResponse {
  summary: {
    total_reports: number
  }
  reports: AuditReportListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Audit detail reuses the exact same shape as VisitReportDetail (SPV report
// detail); audit checklist items additionally carry `photos`. `spvSnapshot`
// is null when the outlet had no SPV report at audit-submit time.
export interface AuditReportDetailResponse {
  audit: VisitReportDetail
  spvSnapshot: VisitReportDetail | null
}
