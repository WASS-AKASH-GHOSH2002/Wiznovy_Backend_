
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchCourses,
  createCourse,
  updateCourse,
  setFilters,
  setThumbnailUpdating,
  updateCourseStatus,
  deleteCourseWithReason,
  fetchCourseById,
  clearCourseDetails,
} from '../store/Courseslice';
import { fetchTutors } from '../store/tutorSlice';
import { fetchSubjects } from '../store/subjectSlice';


import LazyImage from '../components/LazyImage';
import { normalizeImageUrl } from '../utils/imageUtils';
import { validateImageFile } from '../utils/fileValidation';
import Modal from '../components/Modal';

const CourseManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courses, loading, error, totalCount, filters, thumbnailUpdating, selectedCourseDetails, detailsLoading } = useSelector(state => state.courses);
  const { tutors } = useSelector(state => state.tutors);
  const { subjects } = useSelector(state => state.subjectsManagement);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const searchInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const thumbnailUpdateRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    thumbnail: '',
    price: 0,
    discountPrice: 0,
    accessType: 'FREE',
    status: 'PENDING',
    totalDuration: 0,
    totalLectures: 0,
    requirements: '',
    whatYouWillLearn: '',
    validityDays: 0,
    authorMessage: 'Welcome to this comprehensive course',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date().toISOString().slice(0, 16),
    tutorId: '',
    subjectId: '',
    unitIds: []
  });

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchQuery);
    }, 900);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current && searchQuery) {
      const cursorPosition = searchInputRef.current.selectionStart;
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [courses, searchQuery]);

  useEffect(() => {
    const updatedFilters = { ...filters };
    if (keyword) {
      updatedFilters.keyword = keyword;
    } else {
      delete updatedFilters.keyword;
    }
    dispatch(fetchCourses(updatedFilters));
  }, [dispatch, keyword]);

  useEffect(() => {
    forceRefresh();
  }, [dispatch, filters]);



  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
        resetForm();
      }
    };
    
    if (showModal) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);



  useEffect(() => {
    if (formData.accessType === 'FREE') {
      setFormData(prev => ({
        ...prev,
        price: 0,
        discountPrice: 0
      }));
      setShowDiscount(false);
    } else if (formData.accessType === 'PAID' && formData.discountPrice > 0 && formData.discountPrice !== formData.price) {
      setShowDiscount(true);
    }
  }, [formData.accessType, formData.discountPrice, formData.price]);

  const buildFormData = () => {
    const submitData = new FormData();
    
    for (const key of Object.keys(formData)) {
      if (key !== 'imageUrl' && key !== 'thumbnail' && key !== 'unitIds') {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          submitData.append(key, value);
        }
      }
    }
    
    if (formData.unitIds?.length > 0) {
      for (const unitId of formData.unitIds) {
        submitData.append('unitIds[]', unitId);
      }
    }
    
    return submitData;
  };

  const handlePricing = (submitData) => {
    if (formData.accessType === 'FREE') {
      submitData.set('price', '0');
      submitData.set('discountPrice', '0');
    } else if (!showDiscount && formData.accessType === 'PAID') {
      submitData.set('discountPrice', formData.price);
    }
  };

  const addImageFiles = (submitData) => {
    const imageFile = selectedImageFile || fileInputRef.current?.files[0];
    const thumbnailFile = selectedThumbnailFile || thumbnailInputRef.current?.files[0];
    
    if (imageFile) submitData.append('image', imageFile);
    if (thumbnailFile) submitData.append('thumbnail', thumbnailFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = buildFormData();
      handlePricing(submitData);
      addImageFiles(submitData);
      
      const result = await dispatch(
        editingCourse 
          ? updateCourse({ id: editingCourse.id, data: submitData })
          : createCourse(submitData)
      );
      
      if (result.type.endsWith('/fulfilled')) {
        await forceRefresh();
        setShowModal(false);
        resetForm();
        toast.success(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e, type = 'image') => {
    const file = e.target.files[0];
    console.log(`${type} file selected:`, file);
    
    if (!file) {
      console.log(`No ${type} file selected`);
      return;
    }
    
    // Validate image file
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    console.log(`${type} file is valid, creating preview`);
    
    // Store the file in state
    if (type === 'thumbnail') {
      setSelectedThumbnailFile(file);
    } else {
      setSelectedImageFile(file);
    }
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'thumbnail') {
        setThumbnailPreview(e.target.result);
        console.log('Thumbnail preview set');
      } else {
        setImagePreview(e.target.result);
        console.log('Image preview set');
      }
    };
    reader.readAsDataURL(file);
    
    // Show success message for file selection
    toast.success(`${type === 'thumbnail' ? 'Thumbnail' : 'Image'} selected successfully!`);
  };

  const removeImage = (type = 'image') => {
    if (type === 'thumbnail') {
      setThumbnailPreview(null);
      setSelectedThumbnailFile(null);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    } else {
      setImagePreview(null);
      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    
    const hasDiscount = course.discountPrice !== course.price && course.discountPrice > 0;
    
    setFormData({
      name: course.name || '',
      description: course.description || '',
      imageUrl: course.imageUrl || '',
      price: course.price || 0,
      discountPrice: course.discountPrice || 0,
      accessType: course.accessType || 'FREE',
      status: course.status || 'PENDING',
      totalDuration: course.totalDuration || 0,
      totalLectures: course.totalLectures || 0,
      requirements: course.requirements || '',
      whatYouWillLearn: course.whatYouWillLearn || '',
      validityDays: course.validityDays || 0,
      authorMessage: course.authorMessage || 'Welcome to this comprehensive course',
      startDate: course.startDate ? (course.startDate.includes('T') ? course.startDate.slice(0, 16) : course.startDate) : new Date().toISOString().slice(0, 16),
      endDate: course.endDate ? (course.endDate.includes('T') ? course.endDate.slice(0, 16) : course.endDate) : new Date().toISOString().slice(0, 16),
      thumbnail: course.thumbnailUrl || course.thumbnail || '',
      tutorId: course.tutorId || '',
      subjectId: course.subjectId || '',
      unitIds: course.units ? course.units.map(unit => unit.id) : []
    });
    
    // Set image previews
    if (course.imageUrl) {
      setImagePreview(course.imageUrl);
    }
    if (course.thumbnailUrl || course.thumbnail) {
      setThumbnailPreview(course.thumbnailUrl || course.thumbnail);
    }
    
    setShowDiscount(hasDiscount);
    setShowModal(true);
  };

  const handleDelete = (course) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    const result = await dispatch(deleteCourseWithReason({ 
      id: selectedCourse.id, 
      reason: deleteReason 
    }));
    
    if (result.type.endsWith('/fulfilled')) {
      // Force refresh all data to show deletion
      await forceRefresh();
      setShowDeleteModal(false);
      setSelectedCourse(null);
      setDeleteReason('');
      toast.success('Course deleted successfully!');
    }
  };

  const handleStatusUpdate = (course) => {
    setSelectedCourse(course);
    setShowStatusModal(true);
  };

  const handleThumbnailUpdate = (course) => {
    setSelectedCourse(course);
    setShowThumbnailModal(true);
  };

  const handleViewDetails = async (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
    await dispatch(fetchCourseById(course.id));
  };

  const handleThumbnailFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }
    
    // Show loading state
    dispatch(setThumbnailUpdating(true));
    
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const result = await dispatch(updateCourse({ 
        id: selectedCourse.id, 
        data: formData 
      }));
      
      if (result.type.endsWith('/fulfilled')) {
        // Force refresh all data to show updated thumbnail
        await forceRefresh();
        setShowThumbnailModal(false);
        setSelectedCourse(null);
        toast.success('Thumbnail updated successfully!');
      }
    } finally {
      dispatch(setThumbnailUpdating(false));
    }
  };

  const updateStatus = async (status) => {
    const result = await dispatch(updateCourseStatus({ id: selectedCourse.id, status }));
    if (result.type.endsWith('/fulfilled')) {
      forceRefresh();
      setShowStatusModal(false);
      setSelectedCourse(null);
      toast.success('Course status updated successfully!');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      thumbnail: '',
      price: 0,
      discountPrice: 0,
      accessType: 'FREE',
      status: 'PENDING',
      totalDuration: 0,
      totalLectures: 0,
      requirements: '',
      whatYouWillLearn: '',
      validityDays: 0,
      authorMessage: 'Welcome to this comprehensive course',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date().toISOString().slice(0, 16),
      tutorId: '',
      subjectId: '',
      unitIds: []
    });
    setShowDiscount(false);
    setEditingCourse(null);
    setImagePreview(null);
    setThumbnailPreview(null);
    setSelectedImageFile(null);
    setSelectedThumbnailFile(null);
    
    // Properly reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleDiscount = () => {
    setShowDiscount(!showDiscount);
    if (showDiscount) {
      setFormData(prev => ({
        ...prev,
        discountPrice: prev.price
      }));
    }
  };

  const updateFilter = (key, value) => {
    dispatch(setFilters({ [key]: value, offset: 0 }));
  };

  const forceRefresh = async () => {

    await dispatch(fetchCourses(filters));
    dispatch(fetchTutors({ limit: 100, status: 'ACTIVE' }));
    dispatch(fetchSubjects({ limit: 100, status: 'ACTIVE' }));
  };

  const handlePagination = (direction) => {
    const newOffset = direction === 'next' 
      ? filters.offset + filters.limit
      : Math.max(0, filters.offset - filters.limit);
    
    dispatch(setFilters({ offset: newOffset }));
  };

  const StatusBadge = ({ status, onClick }) => {
    const getStatusStyles = (status) => {
      switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'APPROVED': return 'bg-blue-100 text-blue-800';
        case 'REJECTED': return 'bg-red-100 text-red-800';
        case 'DELETED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <button
        onClick={onClick}
        className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${getStatusStyles(status)}`}
      >
        {status}
      </button>
    );
  };

  StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  const ActionButton = ({ onClick, className, title, children }) => (
    <button onClick={onClick} className={className} title={title}>
      {children}
    </button>
  );

  ActionButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
  };

  const ImageUpload = ({ type, preview, onUpload, onRemove, inputRef, disabled }) => (
    <div>
      <label htmlFor={`${type}Upload`} className="block text-sm font-medium text-gray-700 mb-1">
        Course {type === 'thumbnail' ? 'Thumbnail' : 'Image'}
        {inputRef.current?.files[0] && (
          <span className="ml-2 text-green-600 text-xs">✓ File selected</span>
        )}
      </label>
      {preview ? (
        <div className="relative mb-3">
          <img src={preview} alt={`${type} preview`} className="w-full h-32 object-cover rounded-md" />
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-2 pb-2">
              <svg className="w-6 h-6 mb-2 text-gray-500" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="text-xs text-gray-500">Upload {type === 'thumbnail' ? 'Thumbnail' : 'Image'}</p>
            </div>
            <input id={`${type}Upload`} type="file" className="hidden" onChange={onUpload} accept="image/*" ref={inputRef} disabled={disabled} />
          </label>
        </div>
      )}
    </div>
  );

  ImageUpload.propTypes = {
    type: PropTypes.string.isRequired,
    preview: PropTypes.string,
    onUpload: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    inputRef: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
  };

  const PriceDisplay = ({ course }) => {
    if (course.accessType === 'FREE') {
      return <span className="text-green-600 font-medium">Free</span>;
    }
    const hasDiscount = course.discountPrice !== course.price && course.discountPrice > 0;
    return (
      <div className="flex flex-col items-end">
        {hasDiscount ? (
          <>
            <span className="text-red-600 line-through text-sm">${course.price}</span>
            <span className="text-green-600 font-medium">${course.discountPrice}</span>
          </>
        ) : (
          <span className="text-green-600 font-medium">${course.price}</span>
        )}
      </div>
    );
  };

  PriceDisplay.propTypes = {
    course: PropTypes.shape({
      accessType: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      discountPrice: PropTypes.number.isRequired,
    }).isRequired,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className={`max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg ${showModal || showStatusModal || showDeleteModal || showThumbnailModal || showDetailsModal ? 'blur-sm' : ''}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Course Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          Add New Course
        </button>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input - Left Side */}
          <div className="lg:w-1/3">
            <label htmlFor="searchCourses" className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
            <input
              id="searchCourses"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or description..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Filters - Right Side */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="statusFilter"
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>
              
              {/* Access Type Filter */}
              <div>
                <label htmlFor="accessTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
                <select
                  id="accessTypeFilter"
                  value={filters.accessType}
                  onChange={(e) => updateFilter('accessType', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Types</option>
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              
              {/* Subject Filter */}
              <div>
                <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  id="subjectFilter"
                  value={filters.subjectId || ''}
                  onChange={(e) => updateFilter('subjectId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              

              
              {/* Tutor Filter */}
              <div>
                <label htmlFor="tutorFilter" className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
                <select
                  id="tutorFilter"
                  value={filters.tutorId || ''}
                  onChange={(e) => updateFilter('tutorId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Tutors</option>
                  {tutors.map(tutor => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.tutorDetail?.name || tutor.email}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button */}
              <div className="flex items-end col-span-1">
                <button
                  onClick={() => {
                    dispatch(setFilters({
                      status: '',
                      accessType: '',
                      keyword: '',
                      tutorId: '',
                      subjectId: '',
                      offset: 0
                    }));
                    setSearchQuery('');
                    setKeyword('');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Courses List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.message || 'An error occurred'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses && courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {(course.thumbnailUrl || course.imageUrl) ? (
                  <LazyImage 
                    src={normalizeImageUrl(course.thumbnailUrl) || normalizeImageUrl(course.imageUrl)} 
                    alt={course.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{course.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.accessType === 'FREE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {course.accessType}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        {course.totalLectures} lectures • {course.totalDuration} mins
                      </span>
                      <PriceDisplay course={course} />
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Tutor:</span> {course.tutor?.tutorDetail?.name || 'N/A'}
                      {course.tutor?.tutorDetail?.tutorId && (
                        <span className="text-gray-500 ml-2">({course.tutor.tutorDetail.tutorId})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <StatusBadge status={course.status} onClick={() => handleStatusUpdate(course)} />
                    <div className="flex space-x-2">
                      <ActionButton onClick={() => handleViewDetails(course)} className="text-green-600 hover:text-green-800 text-sm flex items-center" title="View Details">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </ActionButton>
                      <ActionButton onClick={() => navigate(`/courses/${course.id}/details`)} className="text-green-600 hover:text-green-800 text-sm">Details</ActionButton>
                      <ActionButton onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</ActionButton>
                      <ActionButton onClick={() => handleStatusUpdate(course)} className="text-purple-600 hover:text-purple-800 text-sm">Status</ActionButton>
                      <ActionButton onClick={() => handleDelete(course)} className="text-red-600 hover:text-red-800 text-sm">Delete</ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No courses found. Try adjusting your filters or add a new course.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls Under Courses */}
      <div className="mt-6">
        <div className="flex items-center gap-4 justify-between">
          <select
            value={filters.limit}
            onChange={(e) => {
              dispatch(setFilters({ limit: Number(e.target.value), offset: 0 }));
            }}
            className="border border-gray-300 px-2 py-1 rounded text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalCount)} of {totalCount} courses
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePagination('prev')}
              disabled={filters.offset === 0}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded">
              Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalCount / filters.limit)}
            </span>
            <button
              onClick={() => handlePagination('next')}
              disabled={filters.offset + filters.limit >= totalCount}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      </div>

      {/* Add/Edit Course Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
      >
        <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Type *</label>
                    <select
                      name="accessType"
                      value={formData.accessType}
                      onChange={handleInputChange}
                      className="w-full p-2 pr-8 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  
                  {formData.accessType === 'PAID' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            name="price"
                            value={formData.price}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              handleInputChange({ target: { name: 'price', value } });
                            }}
                            required
                            className="w-full p-2 pl-8 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            id="applyDiscount"
                            checked={showDiscount}
                            onChange={toggleDiscount}
                            className="mr-2"
                          />
                          <label htmlFor="applyDiscount" className="text-sm font-medium text-gray-700">
                            Apply Discount
                          </label>
                        </div>
                        
                        {showDiscount ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="text"
                              name="discountPrice"
                              value={formData.discountPrice}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                handleInputChange({ target: { name: 'discountPrice', value } });
                              }}
                              required
                              className="w-full p-2 pl-8 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="Discount price"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="text"
                              value={formData.price}
                              disabled
                              className="w-full p-2 pl-8 border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleInputChange}
                      className="w-full p-2 pr-8 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.filter(subject => subject.status === 'ACTIVE').map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.subMaster?.name || subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
                    <select
                      name="tutorId"
                      value={formData.tutorId}
                      onChange={handleInputChange}
                      className="w-full p-2 pr-8 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Tutor</option>
                      {tutors.filter(tutor => tutor.status === 'ACTIVE').map(tutor => (
                        <option key={tutor.id} value={tutor.id}>
                          {tutor.tutorDetail?.name || tutor.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  

                  

                  
                  <ImageUpload 
                    type="image"
                    preview={imagePreview}
                    onUpload={(e) => handleImageUpload(e, 'image')}
                    onRemove={() => removeImage('image')}
                    inputRef={fileInputRef}
                    disabled={thumbnailUpdating}
                  />
                  
                  <ImageUpload 
                    type="thumbnail"
                    preview={thumbnailPreview}
                    onUpload={(e) => handleImageUpload(e, 'thumbnail')}
                    onRemove={() => removeImage('thumbnail')}
                    inputRef={thumbnailInputRef}
                    disabled={thumbnailUpdating}
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Duration (minutes) *</label>
                    <input
                      type="text"
                      name="totalDuration"
                      value={formData.totalDuration}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange({ target: { name: 'totalDuration', value } });
                      }}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Lectures *</label>
                    <input
                      type="text"
                      name="totalLectures"
                      value={formData.totalLectures}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange({ target: { name: 'totalLectures', value } });
                      }}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validity Days *</label>
                    <input
                      type="text"
                      name="validityDays"
                      value={formData.validityDays}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange({ target: { name: 'validityDays', value } });
                      }}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0 for unlimited access"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate && formData.startDate.includes('T') ? formData.startDate.slice(0, 16) : formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate && formData.endDate.includes('T') ? formData.endDate.slice(0, 16) : formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author Message *</label>
                    <textarea
                      name="authorMessage"
                      value={formData.authorMessage}
                      onChange={handleInputChange}
                      rows={2}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Welcome message from the course author"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting || thumbnailUpdating}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingCourse ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : thumbnailUpdating ? 'Uploading...' : (editingCourse ? 'Update' : 'Create')} Course
                  </button>
                </div>
              </form>
      </Modal>

      {/* Status Update Modal */}
      {showStatusModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Update Course Status</h3>
              <p className="text-gray-600 mb-4">Course: {selectedCourse.name}</p>
              <p className="text-sm text-gray-500 mb-6">Current Status: {selectedCourse.status}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => updateStatus('PENDING')}
                  className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  Set as Pending
                </button>
                <button
                  onClick={() => updateStatus('APPROVED')}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Approve Course
                </button>
                <button
                  onClick={() => updateStatus('REJECTED')}
                  className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Reject Course
                </button>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedCourse(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Update Modal */}
      {showThumbnailModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Update Course Thumbnail</h3>
              <p className="text-gray-600 mb-4">Course: <strong>{selectedCourse.name}</strong></p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileUpload}
                  ref={thumbnailUpdateRef}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={thumbnailUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowThumbnailModal(false);
                    setSelectedCourse(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  disabled={thumbnailUpdating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-red-600">Delete Course</h3>
              <p className="text-gray-600 mb-4">Course: <strong>{selectedCourse.name}</strong></p>
              <p className="text-sm text-gray-500 mb-4">This will mark the course as DELETED. Please provide a reason:</p>
              
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion (e.g., Course content violates platform guidelines)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
                required
              />
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCourse(null);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" 
          style={{zIndex: 9999}}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
              setSelectedCourse(null);
              dispatch(clearCourseDetails());
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Course Details</h3>
                  <p className="text-blue-100 mt-1">Complete course information</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDetailsModal(false);
                    setSelectedCourse(null);
                    dispatch(clearCourseDetails());
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 text-lg">Loading course details...</p>
                </div>
              ) : selectedCourseDetails ? (
                <div className="p-6">
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {selectedCourseDetails.thumbnailUrl && (
                        <div className="md:w-1/3">
                          <img 
                            src={selectedCourseDetails.thumbnailUrl} 
                            alt="Course thumbnail" 
                            className="w-full h-48 object-cover rounded-xl shadow-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">{selectedCourseDetails.name}</h1>
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">
                          {selectedCourseDetails.description || 'No description available'}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            selectedCourseDetails.accessType === 'FREE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {selectedCourseDetails.accessType}
                          </span>
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            selectedCourseDetails.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedCourseDetails.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : selectedCourseDetails.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedCourseDetails.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedCourseDetails.totalLectures}</div>
                      <div className="text-sm text-gray-600 mt-1">Lectures</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedCourseDetails.totalDuration}</div>
                      <div className="text-sm text-gray-600 mt-1">Duration</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedCourseDetails.validityDays}</div>
                      <div className="text-sm text-gray-600 mt-1">Days Access</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{selectedCourseDetails.averageRating || '0'}</div>
                      <div className="text-sm text-gray-600 mt-1">Rating</div>
                    </div>
                  </div>
                  
                  {/* Pricing & Tutor Info */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Pricing
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Original Price:</span>
                          <span className="text-xl font-bold text-gray-800">${selectedCourseDetails.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Discount Price:</span>
                          <span className="text-xl font-bold text-green-600">${selectedCourseDetails.discountPrice}</span>
                        </div>
                        {selectedCourseDetails.price !== selectedCourseDetails.discountPrice && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <span className="text-green-800 text-sm font-medium">
                              Save ${(selectedCourseDetails.price - selectedCourseDetails.discountPrice).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Instructor
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-semibold text-gray-800">
                            {selectedCourseDetails.tutor?.tutorDetail?.name || 'N/A'}
                          </p>
                        </div>
                        {selectedCourseDetails.tutor?.tutorDetail?.tutorId && (
                          <div>
                            <span className="text-gray-600">ID:</span>
                            <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {selectedCourseDetails.tutor.tutorDetail.tutorId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Author Message */}
                  {selectedCourseDetails.authorMessage && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Message from Instructor
                      </h3>
                      <p className="text-blue-700 italic leading-relaxed">
                        "{selectedCourseDetails.authorMessage}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Failed to load course details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default CourseManager;