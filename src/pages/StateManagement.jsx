import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, RefreshCw, Settings, Plus } from "lucide-react";
import { fetchStates, createState, updateStateStatus, setSearch, setStatusFilter, setCountryFilter } from "../store/stateSlice";
import { fetchCountries } from "../store/countrySlice";

const StateManagement = () => {
  const dispatch = useDispatch();
  const { states, total, loading, error, filters } = useSelector(state => state.states);
  const { countries } = useSelector(state => state.countries);
  const [selectedState, setSelectedState] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateState, setStatusUpdateState] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    countryId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchStates({ countryId: filters.countryId, limit: itemsPerPage, offset }));
    dispatch(fetchCountries({ limit: 100, status: 'ACTIVE' }));
  }, [dispatch, filters.countryId, currentPage, itemsPerPage]);

  const handleStatusUpdate = (state) => {
    setStatusUpdateState(state);
    setNewStatus(state.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (statusUpdateState && newStatus) {
      dispatch(updateStateStatus({ stateId: statusUpdateState.id, status: newStatus }));
      setShowStatusModal(false);
      setStatusUpdateState(null);
      setNewStatus('');
    }
  };

  const handleViewProfile = (state) => {
    setSelectedState(state);
    setShowProfile(true);
  };

  const handleRefresh = () => {
    dispatch(fetchStates({ countryId: filters.countryId }));
  };

  const handleAddState = () => {
    setFormData({ name: '', code: '', countryId: '' });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createState(formData)).unwrap();
      setShowAddModal(false);
      setFormData({ name: '', code: '', countryId: '' });
      dispatch(fetchStates({ countryId: filters.countryId }));
    } catch (error) {
      console.error('Failed to create state:', error);
    }
  };

  const filteredStates = states.filter((state) => {
    const matchesSearch = !filters.search || 
      state.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      state.code.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || state.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading states...</p>
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
      <div className="max-w-7xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">State Management</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleAddState}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add State
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total States: {total}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          />
          <select
            value={filters.status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVE">Deactive</option>
            <option value="DELETED">Deleted</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>
          <select
            value={filters.countryId}
            onChange={(e) => dispatch(setCountryFilter(e.target.value))}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Name</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Code</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden sm:table-cell">Country</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Status</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStates.map((state, index) => (
                <tr key={state.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-2 sm:p-4 text-sm sm:text-base font-medium">{state.name}</td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base">{state.code}</td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden sm:table-cell">
                    {state.country?.name || 'N/A'}
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      state.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      state.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      state.status === "SUSPENDED" ? "bg-orange-100 text-orange-800" :
                      state.status === "DELETED" ? "bg-gray-100 text-gray-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {state.status}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewProfile(state)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(state)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Update Status"
                      >
                        <Settings size={16} />
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} states
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

        {/* Add State Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New State</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="stateName" className="block text-sm font-medium text-gray-700 mb-2">State Name</label>
                  <input
                    id="stateName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="stateCode" className="block text-sm font-medium text-gray-700 mb-2">State Code</label>
                  <input
                    id="stateCode"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="stateCountry" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    id="stateCountry"
                    value={formData.countryId}
                    onChange={(e) => setFormData({...formData, countryId: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>{country.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Add State
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Profile Modal */}
        {showProfile && selectedState && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-4 sm:p-8 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">State Details</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedState.name}</p>
                <p><strong>Code:</strong> {selectedState.code}</p>
                <p><strong>Country:</strong> {selectedState.country?.name || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedState.status}</p>
                <p><strong>Created:</strong> {new Date(selectedState.createdAt).toLocaleDateString()}</p>
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

        {/* Status Update Modal */}
        {showStatusModal && statusUpdateState && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Update State Status</h3>
              <p className="text-gray-600 mb-4">
                Update status for: <strong>{statusUpdateState.name}</strong>
              </p>
              <div className="mb-4">
                <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-2">Select Status</label>
                <select
                  id="statusSelect"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVE">Deactive</option>
                  <option value="DELETED">Deleted</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdateState(null);
                    setNewStatus('');
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateManagement;