import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveTab,
  setSelectedSubject,
  setSelectedCourse,
  setSelectedSubjectUnit,
  setSelectedCourseUnit,
  setFormData,
  setEditingMaterial,
  resetForm,
  setFilter,
  clearFilters,
  setMessage,
  clearRefetchFlag,
  applyFilters,
  extractFilterOptions,
  fetchSubjects,
  fetchCourses,
  fetchUnits,
  fetchStudyMaterials,
  addStudyMaterial,
  updateStudyMaterial,
  uploadFile
} from "../store/studymaterialSlice"; // This file doesn't exist - commenting out for now

const StudyMaterialManagement = () => {
  // Temporarily disabled due to missing studymaterialSlice
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Study Material Management</h2>
        <p className="text-gray-600">This feature is temporarily unavailable due to missing dependencies.</p>
      </div>
    </div>
  );
  
  /*
  const dispatch = useDispatch();
  const {
    activeTab,
    subjects,
    subjectUnits,
    filteredSubjects,
    selectedSubject,
    selectedSubjectUnit,
    subjectStudyMaterials,
    courses,
    courseUnits,
    filteredCourses,
    selectedCourse,
    selectedCourseUnit,
    courseStudyMaterials,
    loading,
    message,
    title,
    description,
    price,
    accessTypes,
    validityDays,
    editingMaterial,
    filters,
    filterOptions,
    shouldRefetchMaterials
  } = useSelector((state) => state.studyMaterial);

  // Fetch subjects and courses on mount
  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchCourses());
  }, [dispatch]);

  // Extract filter options when subjects or courses change
  useEffect(() => {
    if (subjects.length > 0 && courses.length > 0) {
      dispatch(extractFilterOptions());
    }
  }, [subjects, courses, dispatch]);

  // Apply filters when filters change
  useEffect(() => {
    dispatch(applyFilters());
  }, [filters, activeTab, dispatch]);

  // Auto-refetch materials after file upload
  useEffect(() => {
    if (shouldRefetchMaterials) {
      const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
      if (selectedUnit) {
        dispatch(fetchStudyMaterials({ unitId: selectedUnit, accessTypeFilter: filters.accessTypes }));
      }
      dispatch(clearRefetchFlag());
    }
  }, [shouldRefetchMaterials, activeTab, selectedSubjectUnit, selectedCourseUnit, filters.accessTypes, dispatch]);

  // Fetch units when selected subject/course changes
  const handleSelectItem = (id) => {
    if (activeTab === "subjects") {
      dispatch(setSelectedSubject(id));
    } else {
      dispatch(setSelectedCourse(id));
    }
    
    if (id) {
      dispatch(fetchUnits({ id, activeTab }));
    } else {
      // Clear units if no item selected
      if (activeTab === "subjects") {
        dispatch(setSelectedSubjectUnit(""));
      } else {
        dispatch(setSelectedCourseUnit(""));
      }
    }
  };

  // Fetch study materials when unit is selected
  const handleSelectUnit = (unitId) => {
    if (activeTab === "subjects") {
      dispatch(setSelectedSubjectUnit(unitId));
    } else {
      dispatch(setSelectedCourseUnit(unitId));
    }
    
    if (unitId) {
      dispatch(fetchStudyMaterials({ unitId, accessTypeFilter: filters.accessTypes }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedId = activeTab === "subjects" ? selectedSubject : selectedCourse;
    const selectedUnit = activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
    
    if (!selectedId || !selectedUnit || !title.trim()) {
      dispatch(setMessage("Please fill all required fields."));
      return;
    }

    const payload = {
      title,
      description,
      price,
      accessTypes,
      validityDays: validityDays || 0,
      unitId: selectedUnit
    };
    
    // Add the appropriate ID based on active tab
    if (activeTab === "subjects") {
      payload.subjectId = selectedSubject;
    } else {
      payload.courseId = selectedCourse;
    }

    if (editingMaterial) {
      dispatch(updateStudyMaterial({ materialId: editingMaterial.id, data: payload }));
    } else {
      dispatch(addStudyMaterial({ payload, activeTab }));
    }
  };

  // Handle edit study material
  const handleEditStudyMaterial = (material) => {
    dispatch(setEditingMaterial(material));
  };

  // Cancel edit
  const cancelEdit = () => {
    dispatch(resetForm());
  };

  // Handle file upload
  const handleFileUpload = async (file, materialId, type = 'file') => {
    dispatch(uploadFile({ file, materialId, type }));
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    dispatch(setFilter({ filterType, value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Format display name with all relevant information
  const formatName = (item) => {
    let name = "";
    
    if (activeTab === "subjects") {
      name = item.subMaster?.name || "Unnamed Subject";
    } else {
      name = item.name || "Unnamed Course";
    }
    
    if (item.board?.name) name += ` - ${item.board.name}`;
    if (item.grade?.name) name += ` - ${item.grade.name}`;
    if (item.stream?.name) name += ` - ${item.stream.name}`;
    if (item.semester?.name) name += ` - ${item.semester.name}`;
    if (item.degree?.name) name += ` - ${item.degree.name}`;
    if (item.university?.name) name += ` - ${item.university.name}`;
    return name;
  };

  // Format price
  const formatPrice = (priceValue) => {
    if (priceValue === null || priceValue === undefined) return "0.00";
    const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
    if (isNaN(numericPrice)) return "0.00";
    return numericPrice.toFixed(2);
  };

  // Get current study materials based on active tab
  const getCurrentStudyMaterials = () => {
    return activeTab === "subjects" ? subjectStudyMaterials : courseStudyMaterials;
  };

  // Get current units based on active tab
  const getCurrentUnits = () => {
    return activeTab === "subjects" ? subjectUnits : courseUnits;
  };

  // Get current selected ID based on active tab
  const getCurrentSelectedId = () => {
    return activeTab === "subjects" ? selectedSubject : selectedCourse;
  };

  // Get current selected unit based on active tab
  const getCurrentSelectedUnit = () => {
    return activeTab === "subjects" ? selectedSubjectUnit : selectedCourseUnit;
  };

  // Get current filtered items based on active tab
  const getCurrentFilteredItems = () => {
    return activeTab === "subjects" ? filteredSubjects : filteredCourses;
  };

  // Get file extension
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  };

  // Check if file format is supported
  const isSupportedFormat = (filename) => {
    if (!filename) return false;
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return supportedFormats.includes(extension);
  };

  // Download study material
  const downloadMaterial = async (material) => {
    try {
      dispatch(setMessage("⏳ Preparing download..."));
      
      if (!material.fileUrl) {
        throw new Error("File not available for download.");
      }
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.setAttribute('download', material.fileName || 'study-material');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      dispatch(setMessage("✅ Download started!"));
      
    } catch (err) {
      console.error("Error downloading material:", err);
      dispatch(setMessage("❌ Failed to download material. Please check your permissions."));
    }
  };

  // Supported file formats
  const supportedFormats = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Study Material Management</h2>

        {/* Supported Formats Info */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <strong className="font-bold">Supported File Formats: </strong>
          <span>{supportedFormats.join(', ')}</span>
        </div>

        {/* Tabs for Subjects and Courses */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "subjects" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("subjects"))}
          >
            Subject Materials
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "courses" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
            onClick={() => dispatch(setActiveTab("courses"))}
          >
            Course Materials
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Filter {activeTab === "subjects" ? "Subjects" : "Courses"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.board}
                onChange={(e) => handleFilterChange('board', e.target.value)}
              >
                <option value="">All Boards</option>
                {filterOptions.boards.map((board, index) => (
                  <option key={index} value={board}>{board}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "subjects" ? "Subject Name" : "Course Name"}
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              >
                <option value="">All {activeTab === "subjects" ? "Subjects" : "Courses"}</option>
                {filterOptions.names.map((name, index) => (
                  <option key={index} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
              >
                <option value="">All Grades</option>
                {filterOptions.grades.map((grade, index) => (
                  <option key={index} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.stream}
                onChange={(e) => handleFilterChange('stream', e.target.value)}
              >
                <option value="">All Streams</option>
                {filterOptions.streams.map((stream, index) => (
                  <option key={index} value={stream}>{stream}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
              >
                <option value="">All Semesters</option>
                {filterOptions.semesters.map((semester, index) => (
                  <option key={index} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.degree}
                onChange={(e) => handleFilterChange('degree', e.target.value)}
              >
                <option value="">All Degrees</option>
                {filterOptions.degrees.map((degree, index) => (
                  <option key={index} value={degree}>{degree}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.university}
                onChange={(e) => handleFilterChange('university', e.target.value)}
              >
                <option value="">All Universities</option>
                {filterOptions.universities.map((university, index) => (
                  <option key={index} value={university}>{university}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filters.accessTypes}
                onChange={(e) => handleFilterChange('accessTypes', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3">
            <button
              onClick={handleClearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Subject/Course and Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select {activeTab === "subjects" ? "Subject" : "Course"}
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={getCurrentSelectedId()}
              onChange={(e) => handleSelectItem(e.target.value)}
            >
              <option value="">-- Select {activeTab === "subjects" ? "Subject" : "Course"} --</option>
              {getCurrentFilteredItems().map((item) => (
                <option key={item.id} value={item.id}>
                  {formatName(item)}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getCurrentFilteredItems().length} {activeTab === "subjects" ? "subject(s)" : "course(s)"} found
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2"
              value={getCurrentSelectedUnit()}
              onChange={(e) => handleSelectUnit(e.target.value)}
              disabled={!getCurrentSelectedId()}
            >
              <option value="">-- Select Unit --</option>
              {getCurrentUnits().map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add/Edit Study Material Form */}
        {getCurrentSelectedUnit() && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingMaterial ? 'Edit Study Material' : `Add New Study Material to ${activeTab === "subjects" ? "Subject" : "Course"}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={title}
                  onChange={(e) => dispatch(setFormData({ field: 'title', value: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                value={description}
                onChange={(e) => dispatch(setFormData({ field: 'description', value: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={accessTypes}
                  onChange={(e) => dispatch(setFormData({ field: 'accessTypes', value: e.target.value }))}
                >
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              
              {accessTypes === "PAID" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={price}
                    onChange={(e) => dispatch(setFormData({ field: 'price', value: e.target.value }))}
                    min="0"
                    step="0.01"
                    required={accessTypes === "PAID"}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validity (Days)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={validityDays}
                  onChange={(e) => dispatch(setFormData({ field: 'validityDays', value: e.target.value }))}
                  min="0"
                  placeholder="0 for unlimited"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : editingMaterial ? 'Update Study Material' : 'Add Study Material'}
              </button>
              {editingMaterial && (
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* Show message */}
        {message && (
          <p
            className={`text-sm mb-4 p-2 rounded ${
              message.includes("✅") || message.includes("▶️") || message.includes("⏳") ? "text-green-700 bg-green-100" : 
              message.includes("❌") ? "text-red-700 bg-red-100" :
              "text-blue-700 bg-blue-100"
            }`}
          >
            {message}
          </p>
        )}

        {/* Study Materials List */}
        {getCurrentSelectedUnit() && (
          <>
            <h3 className="text-lg font-semibold mb-4">Study Materials</h3>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : getCurrentStudyMaterials().length > 0 ? (
              <div className="grid gap-4">
                {getCurrentStudyMaterials().map((material) => (
                  <div key={material.id} className="border p-4 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{material.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{material.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            material.accessTypes === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {material.accessTypes === 'FREE' ? 'FREE' : `₹${formatPrice(material.price)}`}
                          </span>
                          {material.validityDays > 0 && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {material.validityDays} days validity
                            </span>
                          )}
                          {material.fileName && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              material.isSupported ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {material.isSupported ? 'File Ready' : `Unsupported format: .${getFileExtension(material.fileName)}`}
                            </span>
                          )}
                          {material.fileName && (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              File: {material.fileName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditStudyMaterial(material)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => downloadMaterial(material)}
                          disabled={!material.fileName || !material.isSupported}
                          className={`px-3 py-1 rounded text-sm ${
                            material.fileName && material.isSupported
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Study File ({supportedFormats.join(', ')})
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-200">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileUpload(e.target.files[0], material.id, 'file');
                                }
                              }}
                            />
                            Choose File
                          </label>
                          <span className="text-sm text-gray-500">
                            {material.fileName ? "Uploaded" : "No file"}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Thumbnail (JPG, PNG)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm cursor-pointer hover:bg-blue-200">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileUpload(e.target.files[0], material.id, 'thumbnail');
                                }
                              }}
                            />
                            Choose Thumbnail
                          </label>
                          {material.thumbnailUrl && (
                            <div className="ml-2">
                              <img 
                                src={material.thumbnailUrl} 
                                alt="Thumbnail" 
                                className="h-10 w-10 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No study materials found for this unit. Create your first one using the form above.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

*/
};

export default StudyMaterialManagement;