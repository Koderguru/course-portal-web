import Link from 'next/link';
import { Batch } from '../../types/Batch';
import { BatchImage } from '../../components/ui/BatchImage';

interface BatchGridProps {
  title: string;
  batches: Batch[];
}

const getBadgeColor = (isSingleBatch: boolean) => {
    return isSingleBatch 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
};

export default function BatchGrid({ title, batches }: BatchGridProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                  </Link>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {title}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">No courses found</h3>
                 <p className="mt-1 text-gray-500 dark:text-gray-400">This bundle seems to be empty.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
