import { Section, parseSectionFromJson } from './Section';
import { Lesson } from './Lesson';
import { LessonType } from './LessonType';

export interface BatchContent {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

export function parseBatchContentFromJson(json: any): BatchContent {
    const sectionsJson = Array.isArray(json.sections) ? json.sections : [];
    const sections = sectionsJson.map(parseSectionFromJson);

    return {
        id: json.id || '',
        title: json.title || '',
        description: json.description || '',
        sections
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
