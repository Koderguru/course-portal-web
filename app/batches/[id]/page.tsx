
import { getChildBatches } from '../../lib/api';
import BatchGrid from '../../courses/[id]/BatchGrid';
import { notFound } from 'next/navigation';

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Logic: This is the "Folder View" (Level 2)
  // We fetch child batches.
  const childBatches = await getChildBatches(id);
  
  if (childBatches.length > 0) {
     const title = id.replace(/-/g, ' ').toUpperCase(); 
     return <BatchGrid title={title} batches={childBatches} />;
  }

  // If no children found for a batch page, 404
  notFound();
}
