export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  url?: string;
  source: JobSource;
  score?: number;
  scoreReasoning?: string;
  createdAt: string;
}

export type JobSource = "manual" | "rss" | "remoteok" | "linkedin";

export interface Resume {
  id: string;
  content: string;
  updatedAt: string;
}

export interface CoverLetter {
  id: string;
  content: string;
  updatedAt: string;
}

export interface TailoredArtifacts {
  resumeBullets: string;
  coverLetter: string;
}
