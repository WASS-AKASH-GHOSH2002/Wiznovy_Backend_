import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Ban, Unlock, RefreshCw, Plus, Edit } from "lucide-react";
import { toast } from 'react-toastify';
import { fetchQualifications, createQualification, updateQualification, updateQualificationStatus, setSearch, setStatusFilter } from "../store/qualificationSlice";

const EducationalLevelManager = () => {
  const dispatch = useDispatch();
  const { qualifications, total, loading, error, filters } = useSelector(state => state.qualifications);
  const [selectedQualification, setSelectedQualification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newQualification, setNewQualification] = useState({ name: '' });
  const [editQualification, setEditQualification] = useState({ name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchQualifications({ limit: itemsPerPage, offset, keyword: filters.search, status: filters.status }));
  }, [dispatch, currentPage, itemsPerPage, filters.search, filters.status]);

  useEffect(() => {
    if (searchInput !== filters.search) {
      const timer = setTimeout(() => {
        dispatch(setSearch(searchInput));
        setCurrentPage(1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchInput, dispatch, filters.search]);

  const handleToggleStatus = async (qualificationId) => {
    const qualification = qualifications.find((q) => q.id === qualificationId);
    if (!qualification) return;

    const newStatus = qualification.status === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
    const result = await dispatch(updateQualificationStatus({ qualificationId, status: newStatus }));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success(`Educational level ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`);
      handleRefresh();
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleViewProfile = (qualification) => {
    setSelectedQualification(qualification);
    setShowProfile(true);
  };

  const handleEdit = (qualification) => {
    setSelectedQualification(qualification);
    setEditQualification({ name: qualification.name });
    setShowEditForm(true);
  };

  const handleRefresh = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchQualifications({ 
      limit: itemsPerPage,
      offset,
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    dispatch(fetchQualifications({ 
      limit: itemsPerPage,
      offset: 0,
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleCreateQualification = async (e) => {
    e.preventDefault();
    if (!newQualification.name.trim()) return;
    
    const result = await dispatch(createQualification(newQualification));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Educational level created successfully!');
      setNewQualification({ name: '' });
      setShowCreateForm(false);
      handleRefresh();
    } else {
      toast.error('Failed to create educational level');
    }
  };

  const handleUpdateQualification = async (e) => {
    e.preventDefault();
    if (!editQualification.name.trim()) return;
    
    const result = await dispatch(updateQualification({ 
      qualificationId: selectedQualification.id, 
      qualificationData: editQualification 
    }));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Educational level updated successfully!');
      setEditQualification({ name: '' });
      setSelectedQualification(null);
      setShowEditForm(false);
      handleRefresh();
    } else {
      toast.error('Failed to update educational level');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading educational levels...</p>
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
          <h2 className="text-3xl font-bold text-gray-800">Educational Level Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Educational Level
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Educational Levels: {total}</p>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by educational level name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 border border-gray-300 p-2.5 rounded-lg"
          />
          <select
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVE">Deactive</option>
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
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Created At</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {qualifications.map((qualification, index) => (
                <tr key={qualification.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4 font-medium">{qualification.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      qualification.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {qualification.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(qualification.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(qualification)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(qualification)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(qualification.id)}
                        className="text-red-600 hover:text-red-800"
                        title={qualification.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      >
                        {qualification.status === "ACTIVE" ? <Ban size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} educational levels
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
      </div>

      {/* Create Educational Level Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add New Educational Level</h3>
            <form onSubmit={handleCreateQualification}>
              <div className="mb-4">
                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Educational Level Name *
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={newQualification.name}
                  onChange={(e) => setNewQualification({ ...newQualification, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Enter educational level name (e.g., B.Tech, M.Tech, PhD)"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewQualification({ name: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create Educational Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Educational Level Modal */}
      {showEditForm && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Educational Level</h3>
            <form onSubmit={handleUpdateQualification}>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Educational Level Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editQualification.name}
                  onChange={(e) => setEditQualification({ ...editQualification, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Enter educational level name"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditQualification({ name: '' });
                    setSelectedQualification(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Educational Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Educational Level Details Modal */}
      {showProfile && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Educational Level Details</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-gray-700">Name</span>
                <p className="text-gray-900">{selectedQualification.name}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700">Status</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedQualification.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {selectedQualification.status}
                </span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700">Created At</span>
                <p className="text-gray-900">{new Date(selectedQualification.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700">Updated At</span>
                <p className="text-gray-900">{new Date(selectedQualification.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowProfile(false);
                  setSelectedQualification(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalLevelManager;