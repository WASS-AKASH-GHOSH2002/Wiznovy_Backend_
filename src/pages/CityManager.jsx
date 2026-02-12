import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, RefreshCw, Settings, Plus } from "lucide-react";
import { toast } from 'react-toastify';
import { createCity, fetchCities, updateCityStatus, setSearch, setStatusFilter, setStateFilter,  } from '../store/citySlice';
import { fetchStates } from '../store/stateSlice';

const CityManager = () => {
  const dispatch = useDispatch();
  const { cities, total, loading, error, filters } = useSelector(state => state.cities);
  const { states } = useSelector(state => state.states);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateCity, setStatusUpdateCity] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    stateId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchCities({ stateId: filters.stateId, limit: itemsPerPage, offset }));
    dispatch(fetchStates({ limit: 100, status: 'ACTIVE' }));
  }, [dispatch, filters.stateId, currentPage, itemsPerPage]);

  const handleStatusUpdate = (city) => {
    setStatusUpdateCity(city);
    setNewStatus(city.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (statusUpdateCity && newStatus) {
      const result = await dispatch(updateCityStatus({ cityId: statusUpdateCity.id, status: newStatus }));
      if (result.type.endsWith('/fulfilled')) {
        toast.success('City status updated successfully!');
        dispatch(fetchCities({ stateId: filters.stateId }));
      } else {
        toast.error('Failed to update city status');
      }
      setShowStatusModal(false);
      setStatusUpdateCity(null);
      setNewStatus('');
    }
  };

  const handleViewProfile = (city) => {
    setSelectedCity(city);
    setShowProfile(true);
  };

  const handleRefresh = () => {
    dispatch(fetchCities({ stateId: filters.stateId }));
  };

  const handleAddCity = () => {
    setFormData({ name: '', stateId: '' });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(createCity(formData)).unwrap();
      setShowAddModal(false);
      setFormData({ name: '', stateId: '' });
      dispatch(fetchCities({ stateId: filters.stateId }));
    } catch (error) {
      console.error('Failed to create city:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading cities...</p>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">City Management</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleAddCity}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add City
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Cities: {total}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name..."
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
          </select>
          <select
            value={filters.stateId}
            onChange={(e) => dispatch(setStateFilter(e.target.value))}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Name</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden sm:table-cell">State</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Status</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city, index) => (
                <tr key={city.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-2 sm:p-4 text-sm sm:text-base font-medium">{city.name}</td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden sm:table-cell">
                    {city.state?.name || 'N/A'}
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      city.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {city.status}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewProfile(city)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(city)}
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

        {/* Pagination */}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} cities
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

        {/* Add City Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New City</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="cityName" className="block text-sm font-medium text-gray-700 mb-2">City Name</label>
                  <input
                    id="cityName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="stateSelect" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    id="stateSelect"
                    value={formData.stateId}
                    onChange={(e) => setFormData({...formData, stateId: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg"
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>{state.name}</option>
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
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </div>
                    ) : 'Add City'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Profile Modal */}
        {showProfile && selectedCity && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-4 sm:p-8 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">City Details</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedCity.name}</p>
                <p><strong>State:</strong> {selectedCity.state?.name || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedCity.status}</p>
                <p><strong>Created:</strong> {new Date(selectedCity.createdAt).toLocaleDateString()}</p>
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
        {showStatusModal && statusUpdateCity && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Update City Status</h3>
              <p className="text-gray-600 mb-4">
                Update status for: <strong>{statusUpdateCity.name}</strong>
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
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdateCity(null);
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

export default CityManager;