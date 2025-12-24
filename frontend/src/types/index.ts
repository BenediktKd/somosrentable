export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: 'investor' | 'executive' | 'admin'
  is_kyc_verified: boolean
  created_at: string
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  short_description: string
  location: string
  address: string
  target_amount: string
  current_amount: string
  remaining_amount: string
  minimum_investment: string
  annual_return_rate: string
  duration_months: number
  main_image: string
  images: ProjectImage[]
  status: 'draft' | 'funding' | 'funded' | 'in_progress' | 'completed' | 'cancelled'
  status_display: string
  funding_progress: string
  investor_count: number
  is_featured: boolean
  funding_start_date: string
  funding_end_date: string
  project_start_date: string | null
  project_end_date: string | null
  created_at: string
}

export interface ProjectImage {
  id: string
  image: string
  caption: string
  order: number
}

export interface Reservation {
  id: string
  email: string
  name: string
  phone: string
  project: string
  project_title: string
  amount: string
  status: 'pending' | 'converted' | 'expired' | 'cancelled'
  status_display: string
  access_token: string
  expires_at: string
  is_expired: boolean
  can_convert: boolean
  created_at: string
}

export interface Investment {
  id: string
  project: string
  project_title: string
  amount: string
  status: 'pending_payment' | 'payment_review' | 'active' | 'completed' | 'cancelled'
  status_display: string
  annual_return_rate_snapshot: string
  duration_months_snapshot: number
  expected_return: string
  actual_return: string
  total_projected_return: string
  monthly_return: string
  activated_at: string | null
  expected_end_date: string | null
  created_at: string
}

export interface KYCStatus {
  has_submission: boolean
  is_verified: boolean
  can_submit: boolean
  message?: string
  submission?: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    status_display: string
    rejection_reason: string
    created_at: string
    reviewed_at: string | null
  }
}

export interface ReturnProjection {
  investment: string
  annual_return_rate: string
  monthly_return: string
  total_return: string
  final_amount: string
  duration_months: number
}

export interface Lead {
  id: string
  email: string
  name: string
  phone: string
  source: 'website' | 'reservation' | 'webhook'
  source_display: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  status_display: string
  assigned_to: string | null
  assigned_to_name: string | null
  notes: string
  project: string | null
  project_title: string | null
  created_at: string
  updated_at: string
}

export interface PaymentProof {
  id: string
  investment: string
  investor_email: string
  project_title: string
  investment_amount: string
  proof_image: string
  amount: string
  bank_name: string
  transaction_reference: string
  transaction_date: string
  status: 'pending' | 'approved' | 'rejected'
  status_display: string
  rejection_reason: string
  created_at: string
  reviewed_at: string | null
}

export interface KYCSubmission {
  id: string
  user: string
  user_email: string
  full_name: string
  document_photo: string
  status: 'pending' | 'approved' | 'rejected'
  status_display: string
  rejection_reason: string
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface PlatformStatistics {
  total_invested: number
  total_investors: number
  total_projects: number
  active_investments: number
  pending_kyc: number
  pending_payments: number
  total_leads: number
  leads_this_month: number
}

export interface ExecutiveStatistics {
  id: string
  email: string
  name: string
  total_leads: number
  new_leads: number
  converted_leads: number
  conversion_rate: number
}
