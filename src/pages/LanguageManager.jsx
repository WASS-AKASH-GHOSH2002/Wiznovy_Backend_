import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Ban, Unlock, RefreshCw, Plus } from "lucide-react";
import { fetchLanguages, createLanguage, updateLanguageStatus, setSearch, setStatusFilter } from "../store/languageSlice";

const LanguageManager = () => {
  const dispatch = useDispatch();
  const { languages, total, loading, error, filters } = useSelector(state => state.languages);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLanguage, setNewLanguage] = useState({ name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchLanguages({ limit: itemsPerPage, offset }));
  }, [dispatch, currentPage, itemsPerPage]);

  const handleToggleStatus = async (languageId) => {
    const language = languages.find((l) => l.id === languageId);
    if (!language) return;

    const newStatus = language.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    dispatch(updateLanguageStatus({ languageId, status: newStatus }));
  };

  const handleViewProfile = (language) => {
    setSelectedLanguage(language);
    setShowProfile(true);
  };

  const handleRefresh = () => {
    dispatch(fetchLanguages({ 
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleSearch = () => {
    dispatch(fetchLanguages({ 
      keyword: filters.search, 
      status: filters.status 
    }));
  };

  const handleCreateLanguage = async (e) => {
    e.preventDefault();
    if (!newLanguage.name.trim()) return;
    
    await dispatch(createLanguage(newLanguage));
    setNewLanguage({ name: '' });
    setShowCreateForm(false);
    dispatch(fetchLanguages({ limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading languages...</p>
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
          <h2 className="text-3xl font-bold text-gray-800">Language Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Language
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Languages: {total}</p>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by language name..."
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
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Created At</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language, index) => (
                <tr key={language.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4 font-medium">{language.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      language.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {language.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(language.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(language)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(language.id)}
                        className="text-red-600 hover:text-red-800"
                        title={language.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      >
                        {language.status === "ACTIVE" ? <Ban size={18} /> : <Unlock size={18} />}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} languages
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

      {/* Create Language Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add New Language</h3>
            <form onSubmit={handleCreateLanguage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Name *
                </label>
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Enter language name"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewLanguage({ name: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Language Details Modal */}
      {showProfile && selectedLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Language Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedLanguage.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedLanguage.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {selectedLanguage.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-gray-900">{new Date(selectedLanguage.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated At</label>
                <p className="text-gray-900">{new Date(selectedLanguage.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowProfile(false);
                  setSelectedLanguage(null);
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

export default LanguageManager;