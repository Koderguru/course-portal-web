import { getCourseContent } from '../../lib/api';
import { notFound } from 'next/navigation';
import CourseView from './CourseView';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Logic: This is ONLY for Direct Content (Course Logic)
  // We do NOT check for child batches here anymore.
  // Routing to bundles is handled by /batches/[id]
  
  const course = await getCourseContent(id);
  if (course) {
    return <CourseView content={course} />;
  }

  notFound();
}
