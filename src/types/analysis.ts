export interface Headline {
  title: string;
  url: string;
  source: string;
  time?: string;
}

export interface TopicGroup {
  topic_name: string;
  headlines: Headline[];
  count?: number;
}

export interface AnalysisResult {
  date: string;
  topic: string;
  is_last_week: boolean;
  time_period: string;
  common_topics: TopicGroup[];
  total_groups: number;
  total_headlines: number;
}