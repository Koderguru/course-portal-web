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
  // Strategy:
  // 1. Try fetching content first. Use a specific flag/check if possible, but we don't have the parent Batch object here easily.
  // 2. If content fetch fails (e.g. 404 or bad format), try fetching child batches.
  // 3. If child batches found, return essentially a "Bundle Content" object.

  try {
      // API Doc says: If singleBatch === false, call /child/{titleId}
      // Since we don't know if it is singleBatch here (we just have ID), we might need to try both or rely on error handling.
      
      // Attempt to get content
      try {
        const json = await fetchDecrypted(`${BASE_URL}/content/${batchId}`);
        if (json) {
            const courseJson = json.course || json;
            return parseBatchContentFromJson({ ...courseJson, id: courseJson.id || batchId });
        }
      } catch (err) {
        // Content endpoint might fail if it's a bundle and the API doesn't serve /content for bundles.
        // Proceed to check for child batches.
      }

      // Check for child batches
      const childBatches = await getChildBatches(batchId);
      if (childBatches.length > 0) {
          // Construct a dummy "Content" object that acts as a container for the batches
          // Use the title from the first child or just format the ID
           const derivedTitle = childBatches[0].title.split('-')[0].trim() + " Bundle"; 
          
          return {
              id: batchId,
              title: derivedTitle,
              description: 'Course Bundle',
              sections: [],
              batches: childBatches
          };
      }

      return null;

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

export async function getChildBatches(titleId: string): Promise<Batch[]> {
  try {
      const json = await fetchDecrypted(`${BASE_URL}/child/${titleId}`);
      
      if (Array.isArray(json)) {
          return json.map((item: any) => ({
              titleId: item.titleId,
              title: item.title || item.titleId,
              imageUrl: item.url || "",
              id: item._id,
              contentHash: item.contentHash,
              created: item.created,
              modified: item.modified,
              isSingleBatch: true // Child batches are usually courses themselves
          }));
      }
      return [];
  } catch (error) {
      console.error(`Error fetching child batches for ${titleId}`, error);
      return [];
  }
}
