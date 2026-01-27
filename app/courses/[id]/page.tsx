import { getBatchContent } from '../../lib/api';
import { notFound } from 'next/navigation';
import CourseView from './CourseView';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getBatchContent(id);

  if (!content) {
    notFound();
  }

  return <CourseView content={content} />;
}
