export type Page = "dashboard" | "artifacts" | "job";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  url?: string | null;
  source: string;
  score?: number | null;
  scoreReasoning?: string | null;
  createdAt: string;
}

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

export interface ReadinessStatus {
  resumeExists: boolean;
  coverLetterExists: boolean;
  totalJobs: number;
  unscoredJobs: number;
  scoredJobs: number;
}
