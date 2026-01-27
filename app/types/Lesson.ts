import { LessonType, getLessonTypeFromString } from './LessonType';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  url: string;
  duration?: number | null;
  sectionTitle?: string | null;
}

export function formatDuration(duration?: number | null): string {
    const totalSeconds = duration || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

export function parseLessonFromJson(json: any): Lesson {
    const type = getLessonTypeFromString(json.type || 'video');
    let lessonUrl = json.url || '';

    // Normalize wistia cloudfront links to fast.wistia m3u8
    if (type === LessonType.VIDEO && lessonUrl.includes('embed-cloudfront.wistia.com/deliveries/')) {
        const match = lessonUrl.match(/deliveries\/([^.]+)/);
        if (match && match[1]) {
            lessonUrl = `https://fast.wistia.com/embed/medias/${match[1]}.m3u8`;
        }
    }

    const duration = typeof json.duration === 'number' ? json.duration : null;

    return {
        id: json.id,
        title: json.title,
        type,
        url: lessonUrl,
        duration,
        sectionTitle: json.sectionTitle
    };
}
