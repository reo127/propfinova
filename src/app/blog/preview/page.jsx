// 'use client';

// import React, { useState, useEffect } from 'react';
// import { format } from 'date-fns';

// export default function BlogPreviewPage() {
//   const [previewData, setPreviewData] = useState(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     try {
//       const data = localStorage.getItem('blogPreview');
//       if (data) {
//         setPreviewData(JSON.parse(data));
//       } else {
//         setError('No preview data found. Please create a blog post and click "Preview".');
//       }
//     } catch (err) {
//       setError('Failed to load preview data. Invalid data format.');
//       console.error('Error loading preview data:', err);
//     }
//   }, []);

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="max-w-2xl w-full bg-surface p-8 rounded-lg shadow-md text-center">
//           <h1 className="text-2xl font-bold text-red-600 mb-4">Preview Error</h1>
//           <p className="text-gray-700">{error}</p>
//           <a href="/admin/blogs/create" className="mt-6 inline-block px-6 py-2 bg-primary text-btn-text rounded-lg">Go Back to Editor</a>
//         </div>
//       </div>
//     );
//   }

//   if (!previewData) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <p className="text-gray-600">Loading Preview...</p>
//       </div>
//     );
//   }

//   const { title, content, featuredImage, author, categories, tags, createdAt } = previewData;

//   return (
//     <div className="bg-gray-50 text-gray-800 font-sans leading-relaxed">
//       {/* Header */}
//       <header className="bg-surface shadow-sm sticky top-0 z-10">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
//           <h2 className="text-xl font-bold text-primary">Blog Preview Mode</h2>
//           <a href="/admin/blogs/create" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Back to Editor</a>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <article>
//           {/* Title */}
//           <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{title}</h1>

//           {/* Meta */}
//           <div className="flex items-center text-sm text-gray-500 mb-8 space-x-4">
//             <span>By {author?.name || 'Admin'}</span>
//             <span className="h-1 w-1 bg-gray-400 rounded-full"></span>
//             <span>{format(new Date(createdAt || Date.now()), 'MMMM dd, yyyy')}</span>
//           </div>

//           {/* Featured Image */}
//           {featuredImage && (
//             <div className="mb-10">
//               <img 
//                 src={featuredImage} 
//                 alt={title} 
//                 className="w-full h-auto max-h-[500px] object-cover rounded-xl shadow-lg"
//               />
//             </div>
//           )}

//           {/* Content */}
//           <div 
//             className="prose prose-lg max-w-none mx-auto text-gray-800"
//             dangerouslySetInnerHTML={{ __html: content }}
//           />

//           {/* Categories & Tags */}
//           <div className="mt-12 pt-8 border-t border-gray-200">
//             {categories && categories.length > 0 && (
//               <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Categories</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {categories.map((cat, index) => (
//                     <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">{cat}</span>
//                   ))}
//                 </div>
//               </div>
//             )}
//             {tags && tags.length > 0 && (
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Tags</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {tags.map((tag, index) => (
//                     <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">#{tag}</span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </article>
//       </main>
//     </div>
//   );
// }

import React from 'react'

const page = () => {
  return (
    <div>Preview page</div>
  )
}

export default page