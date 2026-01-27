import { getBatchesByCategory } from '../../lib/api';
import Link from 'next/link';
import { BatchImage } from '../../components/ui/BatchImage';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batches = await getBatchesByCategory(id);

  // Helper to color code badges based on type
  const getBadgeColor = (isSingle: boolean) => 
     isSingle 
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                  </Link>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {id.replace('-', ' ')} <span className="text-gray-400 dark:text-zinc-600 font-normal">Courses</span>
                  </h1>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {batches.map((batch) => (
            <Link
              key={batch.titleId} 
              href={`/courses/${batch.titleId}`}
              className="block group h-full"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Image Container */}
                <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    <BatchImage
                      src={batch.imageUrl}
                      alt={batch.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Badge */}
                  <div className="mb-3">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(batch.isSingleBatch)}`}>
                        {batch.isSingleBatch ? 'Course' : 'Bundle'}
                     </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {batch.title}
                  </h2>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Start Learning 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.5a.75.75 0 010 1.08l-5.5 5.5a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {batches.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                 <div className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
                    </svg>
                 </div>
                 <h3 className="text-xl font-medium text-gray-900 dark:text-white">Nothing to see here</h3>
                 <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                    We couldn't find any courses for this category. They might be coming soon!
                 </p>
                 <Link href="/" className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Browse other Categories
                 </Link>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
