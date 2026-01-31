import { getBatchContent } from '../../lib/api';
import { notFound } from 'next/navigation';
import CourseView from './CourseView';
import BatchGrid from './BatchGrid';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getBatchContent(id);

  if (!content) {
    notFound();
  }

  // If the content contains batches/bundles (is a parent bundle), show the batch grid
  if (content.batches && content.batches.length > 0) {
      return <BatchGrid title={content.title} batches={content.batches} />;
  }

  return <CourseView content={content} />;
}
