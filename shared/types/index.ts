// Shared types for the monorepo

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

export interface SocialMetrics {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok'
  followers: number
  engagement_rate: number
  posts_count: number
  last_updated: string
}

export interface ContentApproval {
  id: string
  client_id: string
  content_type: 'post' | 'story' | 'reel' | 'video'
  description: string
  media_urls: string[]
  status: 'pending' | 'approved' | 'rejected' | 'revision'
  scheduled_date?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'client' | 'manager'
  profile: {
    name: string
    avatar_url?: string
  }
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  success: boolean
}
