import { decryptPayload } from './crypto';
import { Batch } from '../types/Batch';
import { BatchContent, parseBatchContentFromJson } from '../types/BatchContent';
import { Category } from '../types/Category';

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

export async function getBatches(): Promise<Batch[]> {
  const json = await fetchDecrypted(`${BASE_URL}/batches`);
  
  // The Android code maps "url" to imageUrl and handles other fields.
  if (Array.isArray(json)) {
      return json.map((item: any) => ({
          titleId: item.titleId,
          title: item.title || item.titleId,
          imageUrl: item.url || "",
          id: item._id,
          contentHash: item.contentHash,
          created: item.created,
          modified: item.modified,
          isSingleBatch: item.singleBatch || false
      }));
  }
  return [];
}

export async function getBatchContent(batchId: string): Promise<BatchContent | null> {
  try {
      const json = await fetchDecrypted(`${BASE_URL}/content/${batchId}`);
      // Android code: val courseJson = (data["course"] as? Map<String, Any?>) ?: data
      const courseJson = json.course || json;
      
      // We need to inject the batchId into the result if it's missing, or relies on what parseBatchContentFromJson expects
      // parseBatchContentFromJson expects keys like id, title, description, sections
      
      return parseBatchContentFromJson({ ...courseJson, id: courseJson.id || batchId });
  } catch (error) {
      console.error(`Error loading batch content for ${batchId}`, error);
      return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  const json = await fetchDecrypted(`${BASE_URL}/category`);
  if (Array.isArray(json)) {
      return json.map((item: any) => ({
          id: item.id || '',
          name: item.name || '',
          description: item.description
      }));
  }
  return [];
}

export async function getBatchesByCategory(categoryId: string): Promise<Batch[]> {
  try {
      const json = await fetchDecrypted(`${BASE_URL}/batches/${categoryId}`);
      
      if (Array.isArray(json)) {
          return json.map((item: any) => ({
              titleId: item.titleId,
              title: item.title || item.titleId,
              imageUrl: item.url || "",
              id: item._id,
              contentHash: item.contentHash,
              created: item.created,
              modified: item.modified,
              isSingleBatch: item.singleBatch || false
          }));
      }
      return [];
  } catch (error) {
      console.error(`Error fetching batches for category ${categoryId}`, error);
      return [];
  }
}
