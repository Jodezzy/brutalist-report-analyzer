export interface Headline {
  title: string
  url: string
  source: string
  time?: string
}

export interface ArticleImage {
  url?: string
  alt?: string
  source_url?: string
  // Error information when image extraction fails
  error?: string
  error_type?: string
  attempted_sources?: string[]
  detailed_errors?: Array<{
    source: string
    url: string
    error: string
    error_type: string
  }>
  total_attempts?: number
}

export interface TopicGroup {
  id: number
  topic_name: string
  headlines: Headline[]
  count?: number
  sources_count?: number
  image?: ArticleImage // EXPERIMENTAL: Article image data (success or error info)
}

export interface AnalysisResult {
  date: string
  topic: string
  is_last_week: boolean
  time_period: string
  common_topics: TopicGroup[]
  total_groups: number
  total_headlines: number
}
