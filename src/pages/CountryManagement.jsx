import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Settings, RefreshCw, Plus, Upload, Edit } from "lucide-react";
import { fetchCountries, createCountry, updateCountryStatus, updateCountry, bulkUpdateCountryStatus, setSearch, setStatusFilter } from "../store/countrySlice";
import { validateImageFile } from '../utils/fileValidation';
import { normalizeImageUrl } from '../utils/imageUtils';
import { api } from '../config/axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const CountryManagement = () => {
  const dispatch = useDispatch();
  const { countries, total, loading, error, filters } = useSelector(state => state.countries);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCountry, setNewCountry] = useState({ name: '', code: '' });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateCountry, setStatusUpdateCountry] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedCountryForImage, setSelectedCountryForImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCountry, setEditCountry] = useState(null);
  const [editData, setEditData] = useState({ name: '', code: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  const debouncedSearch = useCallback((searchValue) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setSearch(searchValue));
    }, 500);
  }, [dispatch]);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    const params = { 
      limit: itemsPerPage, 
      offset, 
      keyword: filters.search
    };
    if (filters.status) {
      params.status = filters.status;
    }
    dispatch(fetchCountries(params));
  }, [dispatch, currentPage, itemsPerPage, filters.search, filters.status]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleStatusUpdate = (country) => {
    setStatusUpdateCountry(country);
    setNewStatus(country.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (statusUpdateCountry && newStatus) {
      await dispatch(updateCountryStatus({ countryId: statusUpdateCountry.id, status: newStatus }));
      setShowStatusModal(false);
      setStatusUpdateCountry(null);
      setNewStatus('');
      handleRefresh();
    }
  };

  const handleSelectCountry = (countryId) => {
    setSelectedCountries(prev => 
      prev.includes(countryId) 
        ? prev.filter(id => id !== countryId)
        : [...prev, countryId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCountries(selectedCountries.length === countries.length ? [] : countries.map(c => c.id));
  };

  const handleBulkStatusUpdate = () => {
    if (selectedCountries.length > 0) {
      setShowBulkModal(true);
    }
  };

  const confirmBulkStatusUpdate = async () => {
    if (selectedCountries.length > 0 && bulkStatus) {
      await dispatch(bulkUpdateCountryStatus({ ids: selectedCountries, status: bulkStatus }));
      setShowBulkModal(false);
      setSelectedCountries([]);
      setBulkStatus('');
      handleRefresh();
    }
  };

  const handleViewProfile = (country) => {
    setSelectedCountry(country);
    setShowProfile(true);
  };

  const handleRefresh = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    const params = { 
      limit: itemsPerPage,
      offset,
      keyword: filters.search
    };
    if (filters.status) {
      params.status = filters.status;
    }
    dispatch(fetchCountries(params));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const params = { 
      limit: itemsPerPage,
      offset: 0,
      keyword: filters.search
    };
    if (filters.status) {
      params.status = filters.status;
    }
    dispatch(fetchCountries(params));
  };

  const handleCreateCountry = async (e) => {
    e.preventDefault();
    if (!newCountry.name.trim() || !newCountry.code.trim()) return;
    
    // Check for duplicate country name or code
    const existingCountry = countries.find(country => 
      country.name.toLowerCase() === newCountry.name.trim().toLowerCase() ||
      country.code.toLowerCase() === newCountry.code.trim().toLowerCase()
    );
    
    if (existingCountry) {
      if (existingCountry.name.toLowerCase() === newCountry.name.trim().toLowerCase()) {
        toast.error('A country with this name already exists');
      } else {
        toast.error('A country with this code already exists');
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await dispatch(createCountry(newCountry));
      setNewCountry({ name: '', code: '' });
      setShowCreateForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (country) => {
    setSelectedCountryForImage(country);
    setShowImageUploadModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    
    setSelectedImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadCountryImage = async () => {
    if (!selectedImageFile || !selectedCountryForImage) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedImageFile);
    
    try {
      const response = await api.put(`/country/image/${selectedCountryForImage.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh countries list
      dispatch(fetchCountries({ limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage }));
      
      // Close modal and reset
      setShowImageUploadModal(false);
      setSelectedCountryForImage(null);
      setSelectedImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Image updated successfully!');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCountry = (country) => {
    setEditCountry(country);
    setEditData({ name: country.name, code: country.code });
    setShowEditModal(true);
  };

  const confirmUpdateCountry = async () => {
    if (!editCountry || !editData.name.trim() || !editData.code.trim()) return;
    
    setIsUpdating(true);
    try {
      const result = await dispatch(updateCountry({ 
        countryId: editCountry.id, 
        name: editData.name.trim(), 
        code: editData.code.trim().toUpperCase() 
      }));
      
      if (result.type.endsWith('/fulfilled')) {
        setShowEditModal(false);
        setEditCountry(null);
        setEditData({ name: '', code: '' });
        toast.success('Country updated successfully!');
      } else {
        const errorMessage = result.payload?.message || 'Failed to update country';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to update country');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading countries...</p>
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
          <h2 className="text-3xl font-bold text-gray-800">Country Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Country
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Countries: {total}</p>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by country name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              debouncedSearch(e.target.value);
            }}
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
          {selectedCountries.length > 0 && (
            <button
              onClick={handleBulkStatusUpdate}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Bulk Update ({selectedCountries.length})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCountries.length === countries.length && countries.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Created</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country, index) => (
                <tr key={country.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country.id)}
                      onChange={() => handleSelectCountry(country.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-4">{country.name}</td>
                  <td className="p-4">{country.code}</td>
                  <td className="p-4">
                    {country.imageUrl ? (
                      <img 
                        src={normalizeImageUrl(country.imageUrl)} 
                        alt={country.name} 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      country.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      "bg-red-100 text-red-800"
                    }`}>
                      {country.status}
                    </span>
                  </td>
                  <td className="p-4">{new Date(country.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(country)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(country)}
                        className="text-green-600 hover:text-green-800"
                        title="Update Status"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => handleEditCountry(country)}
                        className="text-orange-600 hover:text-orange-800"
                        title="Edit Country"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleImageUpload(country)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Upload Image"
                      >
                        <Upload size={18} />
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} countries
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

        <Modal 
          isOpen={showCreateForm} 
          onClose={() => setShowCreateForm(false)}
          title="Add New Country"
          maxWidth="max-w-md"
          position="center"
        >
          <form onSubmit={handleCreateCountry} className="space-y-4">
                <input
                  type="text"
                  placeholder="Country Name"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry({...newCountry, name: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Country Code (e.g., USA)"
                  value={newCountry.code}
                  onChange={(e) => setNewCountry({...newCountry, code: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  maxLength={3}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : 'Create'}
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
        </Modal>

        <Modal 
          isOpen={showProfile && selectedCountry} 
          onClose={() => setShowProfile(false)}
          title="Country Details"
          maxWidth="max-w-md"
          position="center"
        >
          {selectedCountry && (
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedCountry.name}</p>
              <p><strong>Code:</strong> {selectedCountry.code}</p>
              <p><strong>Status:</strong> {selectedCountry.status}</p>
              <p><strong>Created:</strong> {new Date(selectedCountry.createdAt).toLocaleDateString()}</p>
              <p><strong>Updated:</strong> {new Date(selectedCountry.updatedAt).toLocaleDateString()}</p>
            </div>
          )}
          <button
            onClick={() => setShowProfile(false)}
            className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </Modal>

        <Modal 
          isOpen={showImageUploadModal && selectedCountryForImage} 
          onClose={() => {
            setShowImageUploadModal(false);
            setSelectedCountryForImage(null);
            setSelectedImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          title="Upload Country Image"
          maxWidth="max-w-md"
          position="center"
        >
          {selectedCountryForImage && (
            <>
              <p className="text-gray-600 mb-4">
                Upload image for: <strong>{selectedCountryForImage.name}</strong>
              </p>
              <div className="mb-4">
                <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
                <input 
                  id="imageUpload"
                  type="file" 
                  onChange={handleFileSelect}
                  accept="image/*"
                  ref={fileInputRef}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowImageUploadModal(false);
                    setSelectedCountryForImage(null);
                    setSelectedImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadCountryImage}
                  className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  disabled={!selectedImageFile || isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : 'Upload Image'}
                </button>
              </div>
            </>
          )}
        </Modal>

        <Modal 
          isOpen={showStatusModal && statusUpdateCountry} 
          onClose={() => {
            setShowStatusModal(false);
            setStatusUpdateCountry(null);
            setNewStatus('');
          }}
          title="Update Country Status"
          maxWidth="max-w-md"
          position="center"
        >
          {statusUpdateCountry && (
            <>
              <p className="text-gray-600 mb-4">
                Update status for: <strong>{statusUpdateCountry.name}</strong>
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
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdateCountry(null);
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
            </>
          )}
        </Modal>
      </div>

      <Modal 
        isOpen={showBulkModal} 
        onClose={() => {
          setShowBulkModal(false);
          setBulkStatus('');
        }}
        title="Bulk Status Update"
        maxWidth="max-w-md"
        position="center"
      >
        <p className="text-gray-600 mb-4">
          Update status for <strong>{selectedCountries.length}</strong> selected countries
        </p>
        <div className="mb-4">
          <label htmlFor="bulkStatusSelect" className="block text-sm font-medium text-gray-700 mb-2">Select Status</label>
          <select
            id="bulkStatusSelect"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">Select Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVE">Deactive</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowBulkModal(false);
              setBulkStatus('');
            }}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkStatusUpdate}
            disabled={!bulkStatus}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            Update Status
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={showEditModal && editCountry} 
        onClose={() => {
          setShowEditModal(false);
          setEditCountry(null);
          setEditData({ name: '', code: '' });
        }}
        title="Edit Country"
        maxWidth="max-w-md"
        position="center"
      >
        {editCountry && (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="editCountryName" className="block text-sm font-medium text-gray-700 mb-2">Country Name</label>
                <input
                  id="editCountryName"
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                  placeholder="Enter country name"
                />
              </div>
              <div>
                <label htmlFor="editCountryCode" className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                <input
                  id="editCountryCode"
                  type="text"
                  value={editData.code}
                  onChange={(e) => setEditData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                  placeholder="Enter country code"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditCountry(null);
                  setEditData({ name: '', code: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateCountry}
                disabled={!editData.name.trim() || !editData.code.trim() || isUpdating}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CountryManagement;