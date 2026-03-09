import { decryptPayload } from './crypto';
import { Category, ParentBatch, ChildBatch, Course } from '../types/api';

const BASE_URL = "https://acdb.pages.dev";
const COURSE_PASSWORD = process.env.COURSE_PASSWORD || "没问题";

async function fetchDecrypted(url: string): Promise<any> {
  console.log(`Fetching from ${url}`);
  const response = await fetch(url, { cache: 'no-store' }); // Disable cache for now to ensure freshness
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  try {
      const decryptedJson = await decryptPayload(buffer, COURSE_PASSWORD);
      return JSON.parse(decryptedJson);
  } catch (e) {
      console.error("Decryption failed", e);
      throw e;
  }
}

// Endpoint 1: Get All Categories
export async function getCategories(): Promise<Category[]> {
  const json = await fetchDecrypted(`${BASE_URL}/category`);
  return Array.isArray(json) ? json : [];
}

// Endpoint 2: Get Batches by Category
export async function getBatchesByCategory(categoryId: string): Promise<ParentBatch[]> {
  const json = await fetchDecrypted(`${BASE_URL}/batches/${categoryId}`);
  return Array.isArray(json) ? json : [];
}

// Endpoint 3: Get Child Batches
export async function getChildBatches(parentTitleId: string): Promise<ChildBatch[]> {
  try {
      const json = await fetchDecrypted(`${BASE_URL}/child/${parentTitleId}`);
      return Array.isArray(json) ? json : [];
  } catch (error) {
      console.error(`Error fetching child batches for ${parentTitleId}`, error);
      return [];
  }
}

// Endpoint 4: Get Course Content
export async function getCourseContent(titleId: string): Promise<Course | null> {
  try {
      const json = await fetchDecrypted(`${BASE_URL}/content/${titleId}`);
      // Response is { course: Course }
      return json.course || null;
  } catch (error) {
     // This is expected if it's a bundle and not a course
     return null;
  }
}
