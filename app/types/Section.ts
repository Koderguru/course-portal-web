import { Lesson, parseLessonFromJson } from './Lesson';

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export function parseSectionFromJson(json: any): Section {
    const lessonsJson = Array.isArray(json.lessons) ? json.lessons : [];
    const lessons = lessonsJson.map(parseLessonFromJson);
    
    return {
        id: json.id || '',
        title: json.title || '',
        lessons
    };
}
