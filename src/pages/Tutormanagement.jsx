import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, RefreshCw, FileText, Download, Settings, Edit } from "lucide-react";
import { exportTutorsToPDF, exportTutorsToCSV } from "../utils/downloadUtils";
import { fetchTutors, updateTutorStatus, bulkUpdateTutorStatus, setSearch, setStatusFilter, updateTutorContact, fetchTutorDetails } from "../store/tutorSlice";
import { fetchCountries } from "../store/countrySlice";
import { fetchSubjects } from "../store/subjectSlice";

const Tutormanagement = () => {
  const dispatch = useDispatch();
  const { tutors, total, loading, error, filters, selectedTutorDetails, detailsLoading } = useSelector(state => state.tutors);
  const { countries } = useSelector(state => state.countries);
  const { subjects } = useSelector(state => state.subjectsManagement || { subjects: [] });
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateTutor, setStatusUpdateTutor] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTutors, setSelectedTutors] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTutor, setUpdateTutor] = useState(null);
  const [updateData, setUpdateData] = useState({ email: '', phoneNumber: '' });
  const [validationErrors, setValidationErrors] = useState({ email: '', phoneNumber: '' });

  useEffect(() => {
    dispatch(fetchCountries({ limit: 100, status: '' }));
    dispatch(fetchSubjects({ limit: 100, status: 'ACTIVE' }));
  }, [dispatch]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const searchInputRef = useRef(null);

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchKeyword);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const handleKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current && searchKeyword) {
      const cursorPosition = searchInputRef.current.selectionStart;
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [tutors, searchKeyword]);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    const fetchParams = { 
      limit: itemsPerPage, 
      offset,
      ...(keyword && { keyword: keyword }),
      ...(filters.status && { status: filters.status }),
      ...(selectedCountry && { countryId: selectedCountry }),
      ...(selectedSubject && { subjectId: selectedSubject })
    };
    
    dispatch(fetchTutors(fetchParams));
  }, [dispatch, keyword, filters.status, selectedCountry, selectedSubject, currentPage, itemsPerPage]);

  const handleStatusUpdate = (tutor) => {
    setStatusUpdateTutor(tutor);
    setNewStatus(tutor.status);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (statusUpdateTutor && newStatus) {
      await dispatch(updateTutorStatus({ tutorId: statusUpdateTutor.id, status: newStatus }));
      setShowStatusModal(false);
      setStatusUpdateTutor(null);
      setNewStatus('');
      
      // Refresh data to ensure filter consistency
      const offset = (currentPage - 1) * itemsPerPage;
      const fetchParams = { 
        limit: itemsPerPage, 
        offset,
        ...(keyword && { keyword: keyword }),
        ...(filters.status && { status: filters.status }),
        ...(selectedCountry && { countryId: selectedCountry }),
        ...(selectedSubject && { subjectId: selectedSubject })
      };
      dispatch(fetchTutors(fetchParams));
    }
  };

  const handleSelectTutor = (tutorId) => {
    setSelectedTutors(prev => 
      prev.includes(tutorId) 
        ? prev.filter(id => id !== tutorId)
        : [...prev, tutorId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTutors(selectedTutors.length === tutors.length ? [] : tutors.map(t => t.id));
  };

  const handleBulkStatusUpdate = () => {
    if (selectedTutors.length > 0) {
      setShowBulkModal(true);
    }
  };

  const confirmBulkStatusUpdate = async () => {
    if (selectedTutors.length > 0 && bulkStatus) {
      await dispatch(bulkUpdateTutorStatus({ ids: selectedTutors, status: bulkStatus }));
      setShowBulkModal(false);
      setSelectedTutors([]);
      setBulkStatus('');
      
      // Refresh data to ensure filter consistency
      const offset = (currentPage - 1) * itemsPerPage;
      const fetchParams = { 
        limit: itemsPerPage, 
        offset,
        ...(keyword && { keyword: keyword }),
        ...(filters.status && { status: filters.status }),
        ...(selectedCountry && { countryId: selectedCountry }),
        ...(selectedSubject && { subjectId: selectedSubject })
      };
      dispatch(fetchTutors(fetchParams));
    }
  };

  const handleUpdateContact = (tutor) => {
    setUpdateTutor(tutor);
    setUpdateData({ email: tutor.email, phoneNumber: tutor.phoneNumber });
    setValidationErrors({ email: '', phoneNumber: '' });
    setShowUpdateModal(true);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z.@]/g, '');
    setUpdateData(prev => ({ ...prev, email: value }));
    if (value && !validateEmail(value)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setUpdateData(prev => ({ ...prev, phoneNumber: value }));
    if (value && value.length < 10) {
      setValidationErrors(prev => ({ ...prev, phoneNumber: 'Phone number must be at least 10 digits' }));
    } else {
      setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const confirmUpdateContact = async () => {
    if (updateTutor && updateData.email.trim() && updateData.phoneNumber.trim() && 
        validateEmail(updateData.email) && !validationErrors.email && !validationErrors.phoneNumber) {
      const result = await dispatch(updateTutorContact({ 
        id: updateTutor.id, 
        email: updateData.email.trim(),
        phoneNumber: updateData.phoneNumber.trim()
      }));
      
      if (result.type.endsWith('/fulfilled')) {
        const offset = (currentPage - 1) * itemsPerPage;
        const fetchParams = { 
          limit: itemsPerPage, 
          offset,
          ...(keyword && { keyword: keyword }),
          ...(filters.status && { status: filters.status }),
          ...(selectedCountry && { countryId: selectedCountry }),
          ...(selectedSubject && { subjectId: selectedSubject })
        };
        dispatch(fetchTutors(fetchParams));
      }
      
      setShowUpdateModal(false);
      setUpdateTutor(null);
      setUpdateData({ email: '', phoneNumber: '' });
      setValidationErrors({ email: '', phoneNumber: '' });
    }
  };

  const handleViewProfile = async (tutor) => {
    setSelectedTutor(tutor);
    setShowProfile(true);
    await dispatch(fetchTutorDetails(tutor.id));
  };

  const handleRefresh = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    const fetchParams = { 
      limit: itemsPerPage, 
      offset,
      ...(keyword && { keyword: keyword }),
      ...(filters.status && { status: filters.status }),
      ...(selectedCountry && { countryId: selectedCountry }),
      ...(selectedSubject && { subjectId: selectedSubject })
    };
    dispatch(fetchTutors(fetchParams));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading tutors...</p>
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className={`max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg ${showProfile || showStatusModal || showBulkModal || showUpdateModal ? 'blur-sm' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Tutor Management</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Download size={18} /> Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    onClick={() => {
                      exportTutorsToPDF(tutors);
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      exportTutorsToCSV(tutors);
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Tutors: {total}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name or email..."
            value={searchKeyword}
            onChange={handleKeywordChange}
            className="w-full border border-gray-300 p-2.5 rounded-lg lg:col-span-1"
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
            value={selectedSubject}
            onChange={(e) => {
              console.log('Subject selected:', e.target.value);
              setSelectedSubject(e.target.value);
            }}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Subjects</option>
            {subjects && subjects.length > 0 ? subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            )) : null}
          </select>
          <select
            value={selectedCountry}
            onChange={(e) => {
              console.log('Country selected:', e.target.value);
              setSelectedCountry(e.target.value);
            }}
            className="w-full border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Countries</option>
            {countries && countries.length > 0 ? countries.map(country => (
              <option key={country.id} value={country.id}>{country.name}</option>
            )) : null}
          </select>
          {selectedTutors.length > 0 && (
            <button
              onClick={handleBulkStatusUpdate}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Bulk Update ({selectedTutors.length})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">
                  <input
                    type="checkbox"
                    checked={selectedTutors.length === tutors.length && tutors.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Tutor ID</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Name</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden sm:table-cell">Email</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden lg:table-cell">Phone</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden lg:table-cell">Gender</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Rating</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base hidden md:table-cell">Rate</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Status</th>
                <th className="p-2 sm:p-4 text-left text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tutors.map((tutor, index) => (
                <tr key={tutor.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-2 sm:p-4 text-sm sm:text-base">
                    <input
                      type="checkbox"
                      checked={selectedTutors.includes(tutor.id)}
                      onChange={() => handleSelectTutor(tutor.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base">
                    {tutor.tutorDetail?.tutorId || "N/A"}
                  </td>
                  <td className="p-2 sm:p-4">
                    <div>
                      <div className="font-medium text-sm sm:text-base">{tutor.tutorDetail?.name || "N/A"}</div>
                      <div className="text-gray-500 text-xs sm:hidden">{tutor.email}</div>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden sm:table-cell">{tutor.email}</td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden lg:table-cell">{tutor.phoneNumber}</td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden lg:table-cell">{tutor.tutorDetail?.gender || "N/A"}</td>
                  <td className="p-2 sm:p-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm sm:text-base">{tutor.tutorDetail?.averageRating || "0.00"}</span>
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-500 text-xs hidden sm:inline">({tutor.tutorDetail?.totalRatings || 0})</span>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-sm sm:text-base hidden md:table-cell">${tutor.tutorDetail?.hourlyRate || "0.00"}/hr</td>
                  <td className="p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tutor.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      tutor.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      tutor.status === "SUSPENDED" ? "bg-orange-100 text-orange-800" :
                      tutor.status === "DELETED" ? "bg-gray-100 text-gray-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {tutor.status}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewProfile(tutor)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      {tutor.tutorDetail?.document && (
                        <button
                          onClick={() => window.open(tutor.tutorDetail.document, '_blank')}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="View Document"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(tutor)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Update Status"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateContact(tutor)}
                        className="text-orange-600 hover:text-orange-800 p-1"
                        title="Update Contact"
                      >
                        <Edit size={16} />
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} tutors
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

      {/* Profile Modal */}
      {showProfile && selectedTutor && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" 
          onClick={() => setShowProfile(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowProfile(false)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div 
            className="bg-white p-8 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <h3 className="text-xl font-bold mb-4">Tutor Profile</h3>
            {detailsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="animate-spin h-8 w-8 mx-auto text-blue-500" />
                <p className="mt-2 text-gray-600">Loading details...</p>
              </div>
            ) : selectedTutorDetails ? (
              <div>
                <div className="flex justify-center mb-6">
                  {selectedTutorDetails.profileImage ? (
                    <img src={selectedTutorDetails.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-lg">
                      <span className="text-white text-4xl font-bold">{selectedTutorDetails.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedTutorDetails).filter(([key]) => key !== 'profileImage' && key !== 'id').map(([key, value]) => {
                    let displayValue = "N/A";
                    if (value !== null && value !== undefined) {
                      if (typeof value === 'object') {
                        displayValue = value?.name || "N/A";
                      } else {
                        displayValue = String(value);
                      }
                    }
                    return (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm font-medium text-gray-800">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No details available</p>
            )}
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
      {showStatusModal && statusUpdateTutor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Tutor Status</h3>
            <p className="text-gray-600 mb-4">
              Update status for: <strong>{statusUpdateTutor.tutorDetail?.name || statusUpdateTutor.email}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Status</label>
              <select
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
                  setStatusUpdateTutor(null);
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

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Bulk Status Update</h3>
            <p className="text-gray-600 mb-4">
              Update status for <strong>{selectedTutors.length}</strong> selected tutors
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg"
              >
                <option value="">Select Status</option>
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
          </div>
        </div>
      )}

      {/* Update Contact Modal */}
      {showUpdateModal && updateTutor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Contact</h3>
            <p className="text-gray-600 mb-4">
              Update contact for: <strong>{updateTutor.tutorDetail?.name || updateTutor.email}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={updateData.email}
                  onChange={handleEmailChange}
                  className={`w-full border p-2.5 rounded-lg ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter email address (letters, dots, @ only)"
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={updateData.phoneNumber}
                  onChange={handlePhoneChange}
                  className={`w-full border p-2.5 rounded-lg ${validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter phone number (numbers only)"
                  required
                />
                {validationErrors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdateTutor(null);
                  setUpdateData({ email: '', phoneNumber: '' });
                  setValidationErrors({ email: '', phoneNumber: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateContact}
                disabled={!updateData.email.trim() || !updateData.phoneNumber.trim() || validationErrors.email || validationErrors.phoneNumber || !validateEmail(updateData.email)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                Update Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutormanagement;