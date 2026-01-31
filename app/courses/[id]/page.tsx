import { getCourseContent, getChildBatches } from '../../lib/api';
import { notFound } from 'next/navigation';
import CourseView from './CourseView';
import BatchGrid from './BatchGrid';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to load as a course first (single batch)
  const course = await getCourseContent(id);
  if (course) {
    return <CourseView content={course} />;
  }

  // If not a course, try to load as a bundle (child batches)
  const childBatches = await getChildBatches(id);
  if (childBatches.length > 0) {
     // We need a title for the grid. Since we don't have the parent batch info here,
     // we can infer it or just use the ID. 
     // Ideally, the previous page passed it, but for robust direct linking:
     const title = id.replace(/-/g, ' ').toUpperCase(); 
     return <BatchGrid title={title} batches={childBatches as any} />; // Casting because BatchGrid expects UI Batch type, but ChildBatch is compatible mostly
  }

  notFound();
}
