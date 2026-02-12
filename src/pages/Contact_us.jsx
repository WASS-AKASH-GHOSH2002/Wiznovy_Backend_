import React, { useEffect, useState } from "react";
import { api } from "../config/axios";
import { FiSearch, FiChevronLeft, FiChevronRight, FiMail, FiPhone, FiUser, FiMessageSquare, FiCalendar } from "react-icons/fi";

export default function ContactUsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/contact-us/all", {
        params: { keyword, limit, offset },
      });
      setContacts(res.data.result || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [keyword, limit, offset]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setOffset(0); // Reset to first page when changing limit
  };

  return (
    // <div className="p-6 bg-gray-50 min-h-screen">
    //   <div className="max-w-7xl mx-auto">
    //     <div className="bg-white rounded-lg shadow-md p-6">
    //       {/* Header */}
    //       <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
    //         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
    //           <FiMessageSquare className="mr-2 text-blue-600" />
    //           Contact Us Messages
    //         </h2>
    //         <div className="mt-4 md:mt-0">
    //           <span className="text-sm text-gray-600">
    //             Total: {total} messages
    //           </span>
    //         </div>
    //       </div>

    //       {/* Search and Filters */}
    //       <div className="flex flex-col md:flex-row gap-4 mb-6">
    //         <div className="relative flex-grow">
    //           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    //             <FiSearch className="text-gray-400" />
    //           </div>
    //           <input
    //             type="text"
    //             placeholder="Search by name, email, or query..."
    //             className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    //             value={keyword}
    //             onChange={(e) => setKeyword(e.target.value)}
    //           />
    //         </div>
            
    //         <div className="flex items-center">
    //           <label htmlFor="limit" className="mr-2 text-sm text-gray-600">Show:</label>
    //           <select
    //             id="limit"
    //             value={limit}
    //             onChange={handleLimitChange}
    //             className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    //           >
    //             <option value="5">5</option>
    //             <option value="10">10</option>
    //             <option value="25">25</option>
    //             <option value="50">50</option>
    //           </select>
    //         </div>
    //       </div>

    //       {/* Table */}
    //       <div className="overflow-x-auto rounded-lg shadow">
    //         <table className="min-w-full bg-white">
    //           <thead className="bg-gray-100">
    //             <tr>
    //               <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    //                 <div className="flex items-center">
    //                   <FiUser className="mr-1" /> Name
    //                 </div>
    //               </th>
    //               <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    //                 <div className="flex items-center">
    //                   <FiMail className="mr-1" /> Email
    //                 </div>
    //               </th>
    //               <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    //                 <div className="flex items-center">
    //                   <FiPhone className="mr-1" /> Mobile
    //                 </div>
    //               </th>
    //               <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    //                 Query
    //               </th>
    //               <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    //                 <div className="flex items-center">
    //                   <FiCalendar className="mr-1" /> Date
    //                 </div>
    //               </th>
    //             </tr>
    //           </thead>
    //           <tbody className="divide-y divide-gray-200">
    //             {loading ? (
    //               // Loading state
    //               <tr>
    //                 <td colSpan="5" className="py-8 text-center">
    //                   <div className="flex justify-center">
    //                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    //                   </div>
    //                   <p className="mt-2 text-gray-500">Loading messages...</p>
    //                 </td>
    //               </tr>
    //             ) : contacts.length === 0 ? (
    //               // Empty state
    //               <tr>
    //                 <td colSpan="5" className="py-8 text-center">
    //                   <div className="flex justify-center">
    //                     <FiMessageSquare className="h-12 w-12 text-gray-300" />
    //                   </div>
    //                   <p className="mt-2 text-gray-500">
    //                     {keyword ? 'No messages found for your search.' : 'No contact messages yet.'}
    //                   </p>
    //                 </td>
    //               </tr>
    //             ) : (
    //               // Data rows
    //               contacts.map((item) => (
    //                 <tr key={item.id} className="hover:bg-gray-50 transition-colors">
    //                   <td className="py-4 px-4">
    //                     <div className="text-sm font-medium text-gray-900">
    //                       {item.account?.userDetail?.name || 'N/A'}
    //                     </div>
    //                   </td>
    //                   <td className="py-4 px-4">
    //                     <div className="text-sm text-gray-900">
    //                       {item.account?.email || 'N/A'}
    //                     </div>
    //                   </td>
    //                   <td className="py-4 px-4">
    //                     <div className="text-sm text-gray-900">
    //                       {item.account?.userDetail?.mobileNumber || 'N/A'}
    //                     </div>
    //                   </td>
    //                   <td className="py-4 px-4">
    //                     <div className="text-sm text-gray-900 max-w-xs truncate" title={item.query}>
    //                       {item.query}
    //                     </div>
    //                   </td>
    //                   <td className="py-4 px-4">
    //                     <div className="text-xs text-gray-500">
    //                       {new Date(item.createdAt).toLocaleDateString()}
    //                     </div>
    //                     <div className="text-xs text-gray-400">
    //                       {new Date(item.createdAt).toLocaleTimeString()}
    //                     </div>
    //                   </td>
    //                 </tr>
    //               ))
    //             )}
    //           </tbody>
    //         </table>
    //       </div>

    //       {/* Pagination */}
    //       {total > 0 && (
    //         <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2">
    //           <div className="text-sm text-gray-700 mb-4 sm:mb-0">
    //             Showing <span className="font-medium">{offset + 1}</span> to{" "}
    //             <span className="font-medium">{Math.min(offset + limit, total)}</span> of{" "}
    //             <span className="font-medium">{total}</span> results
    //           </div>
              
    //           <div className="flex space-x-2">
    //             <button
    //               disabled={offset === 0}
    //               onClick={() => setOffset(Math.max(offset - limit, 0))}
    //               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    //             >
    //               <FiChevronLeft className="mr-1" /> Previous
    //             </button>
    //             <button
    //               disabled={offset + limit >= total}
    //               onClick={() => setOffset(offset + limit)}
    //               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    //             >
    //               Next <FiChevronRight className="ml-1" />
    //             </button>
    //           </div>
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>
    <h1>Contact Us Management Coming Soon</h1>
  );
}