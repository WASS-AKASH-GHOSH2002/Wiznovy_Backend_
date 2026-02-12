import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Ban, Unlock, RefreshCw, Image, Plus } from "lucide-react";
import { fetchSubjects, createSubject, updateSubjectStatus, setSearch, setStatusFilter } from "../store/subjectSlice";

const SubjectNew = () => {
  const dispatch = useDispatch();
  const { subjects, total, loading, error, filters } = useSelector(state => state.subjectsManagement);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchSubjects({ limit: itemsPerPage, offset }));
  }, [dispatch, currentPage, itemsPerPage]);

  const handleToggleStatus = async (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const newStatus = subject.status === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    dispatch(updateSubjectStatus({ subjectId, status: newStatus }));
  };

  const handleViewProfile = (subject) => {
    setSelectedSubject(subject);
    setShowProfile(true);
  };

  const handleRefresh = () => {
    dispatch(fetchSubjects({ 
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleSearch = () => {
    dispatch(fetchSubjects({ 
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    
    await dispatch(createSubject(newSubject));
    setNewSubject({ name: '', description: '' });
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Subject Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Subject
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Subjects: {total}</p>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by subject name..."
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="flex-1 border border-gray-300 p-2.5 rounded-lg"
          />
          <select
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={handleSearch}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={subject.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4">
                    {subject.image ? (
                      <img 
                        src={subject.image} 
                        alt={subject.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center ${subject.image ? 'hidden' : 'flex'}`}>
                      <Image size={20} className="text-gray-400" />
                    </div>
                  </td>
                  <td className="p-4">{subject.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      subject.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {subject.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(subject)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(subject.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {subject.status === "ACTIVE" ? <Ban size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Left side under table */}
        <div className="mt-6">
          <div className="flex items-center gap-4 justify-between">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-2 py-1 rounded text-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} subjects
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-gray-100 rounded">
                Page {currentPage} of {Math.ceil(total / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(total / itemsPerPage)}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Subject</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg h-20 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showProfile && selectedSubject && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Subject Details</h3>
              <div className="space-y-2">
                {selectedSubject.image && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={selectedSubject.image} 
                      alt={selectedSubject.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
                <p><strong>Name:</strong> {selectedSubject.name}</p>
                <p><strong>Description:</strong> {selectedSubject.description || "No description"}</p>
                <p><strong>Status:</strong> {selectedSubject.status}</p>
                <p><strong>Created:</strong> {new Date(selectedSubject.createdAt).toLocaleDateString()}</p>
                <p><strong>Updated:</strong> {new Date(selectedSubject.updatedAt).toLocaleDateString()}</p>
                {selectedSubject.imagePath && (
                  <p><strong>Image Path:</strong> {selectedSubject.imagePath}</p>
                )}
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectNew;