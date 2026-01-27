export enum LessonType {
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  YOUTUBE = 'YOUTUBE',
}

export function getLessonTypeFromString(value: string): LessonType {
  switch (value.toLowerCase()) {
    case 'video':
      return LessonType.VIDEO;
    case 'pdf':
      return LessonType.PDF;
    case 'youtube':
      return LessonType.YOUTUBE;
    default:
      return LessonType.VIDEO;
  }
}
