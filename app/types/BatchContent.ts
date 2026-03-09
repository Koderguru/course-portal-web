import { Section, parseSectionFromJson } from './Section';
import { Lesson } from './Lesson';
import { LessonType } from './LessonType';
import { Batch } from './Batch';

export interface BatchContent {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  batches?: Batch[];
}

export function parseBatchContentFromJson(json: any): BatchContent {
    const sectionsJson = Array.isArray(json.sections) ? json.sections : [];
    const sections = sectionsJson.map(parseSectionFromJson);

    // Parse batches if they exist (for Bundles)
    const batchesJson = Array.isArray(json.batches) ? json.batches : [];
    const batches: Batch[] = batchesJson.map((item: any) => ({
        titleId: item.titleId,
        title: item.title || item.titleId,
        imageUrl: item.url || "",
        id: item._id,
        contentHash: item.contentHash,
        created: item.created,
        modified: item.modified,
        isSingleBatch: item.singleBatch || false
    }));

    return {
        id: json.id || '',
        title: json.title || '',
        description: json.description || '',
        sections,
        batches
    };
}

export function getAllLessons(batchContent: BatchContent): Lesson[] {
    return batchContent.sections.flatMap(section => 
        section.lessons.map(lesson => ({
            ...lesson,
            sectionTitle: section.title
        }))
    );
}

export function getTotalLessons(batchContent: BatchContent): number {
    return getAllLessons(batchContent).length;
}

export function getVideoCount(batchContent: BatchContent): number {
    return getAllLessons(batchContent).filter(l => l.type === LessonType.VIDEO).length;
}

export function getPdfCount(batchContent: BatchContent): number {
    return getAllLessons(batchContent).filter(l => l.type === LessonType.PDF).length;
}

export function getYoutubeCount(batchContent: BatchContent): number {
    return getAllLessons(batchContent).filter(l => l.type === LessonType.YOUTUBE).length;
}
