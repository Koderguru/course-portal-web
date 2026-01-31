// Exact types from ApnaCoder Frontend API Documentation

export interface Category {
  id: string; // e.g., "development", "dsa", "web"
  name: string; // e.g., "Development", "DSA & CP"
  description: string;
}

export interface ParentBatch {
  _id: string; // MongoDB ObjectId
  title: string; // Batch display name
  titleId: string; // URL-safe identifier
  url: string; // Thumbnail image URL
  totalHours: number; // Total content hours
  created: number; // Unix timestamp (seconds)
  modified: number; // Unix timestamp (seconds)
  contentHash: string; // Content version hash
  singleBatch: boolean; // true if no child batches
  category: Category; // Category info
}

export interface ChildBatch {
  _id: string;
  title: string;
  titleId: string; // Use this to fetch content
  url: string;
  totalHours: number;
  created: number;
  modified: number;
  contentHash: string;
}

export interface Lesson {
  id: number;
  title: string;
  type: "video" | "youtube" | "pdf";
  duration?: number; // seconds (for video/youtube)
  url: string; // Video/PDF URL
}

export interface Section {
  id: string;
  title: string;
  isAvailable: boolean; // false = "Coming Soon"
  lessons: Lesson[];
}

export interface Course {
  id: string; // Same as titleId
  title: string;
  description: string;
  sections: Section[];
}
