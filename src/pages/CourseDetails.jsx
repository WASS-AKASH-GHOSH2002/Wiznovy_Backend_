import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, FileText, Calendar, ChevronDown, ChevronUp, BookOpen, Play, Download, Eye, RefreshCw, Plus } from 'lucide-react';
import { 
  fetchCourseUnits, 
  fetchStudyMaterials, 
  fetchVideoLectures, 
  fetchVideoStudyMaterials,
  toggleUnit, 
  toggleMaterials, 
  toggleVideos,
  toggleVideoMaterials
} from '../store/courseDetailsSlice';
import { createUnit, updateUnit, updateUnitStatus, updateUnitImage } from '../store/unitSlice';
import { createVideoLecture } from '../store/videoLectureSlice';
import { createStudyMaterial, updateStudyMaterial, updateStudyMaterialPdf } from '../store/studyMaterialSlice';

import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { units, courseName, loading, error, expandedUnits, expandedMaterials, expandedVideos, studyMaterials, materialsLoading, videoLectures, videosLoading, videoStudyMaterials, videoMaterialsLoading, expandedVideoMaterials } = useSelector(state => state.courseDetails);
  const { loading: unitLoading } = useSelector(state => state.units);
  const { loading: videoLoading } = useSelector(state => state.videoLecture);
  const { loading: studyMaterialLoading } = useSelector(state => state.studyMaterial);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showStudyMaterialModal, setShowStudyMaterialModal] = useState(false);
  const [showVideoStudyMaterialModal, setShowVideoStudyMaterialModal] = useState(false);
  const [showEditStudyMaterialModal, setShowEditStudyMaterialModal] = useState(false);
  const [showUpdatePdfModal, setShowUpdatePdfModal] = useState(false);
  const [selectedStudyMaterial, setSelectedStudyMaterial] = useState(null);
  const [selectedEditStudyFile, setSelectedEditStudyFile] = useState(null);
  const [selectedUnitForVideo, setSelectedUnitForVideo] = useState(null);
  const [selectedUnitForStudyMaterial, setSelectedUnitForStudyMaterial] = useState(null);
  const [selectedVideoForStudyMaterial, setSelectedVideoForStudyMaterial] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: courseId,
    image:''
  });
  
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    unitId: ''
  });
  
  const [studyMaterialFormData, setStudyMaterialFormData] = useState({
    title: '',
    description: '',
    unitId: ''
  });
  
  const [videoStudyMaterialFormData, setVideoStudyMaterialFormData] = useState({
    title: '',
    description: '',
    videoLectureId: ''
  });
  
  const [selectedStudyFile, setSelectedStudyFile] = useState(null);
  const [selectedVideoStudyFile, setSelectedVideoStudyFile] = useState(null);






  useEffect(() => {
    dispatch(fetchCourseUnits(courseId));
  }, [dispatch, courseId]);

  const handleRefresh = () => {
    dispatch(fetchCourseUnits(courseId));
  };



  const handleToggleUnit = (unitId) => {
    dispatch(toggleUnit(unitId));
  };

  const handleToggleMaterials = (unitId) => {
    dispatch(toggleMaterials(unitId));
    if (!studyMaterials[unitId]) {
      dispatch(fetchStudyMaterials({ unitId }));
    }
  };

  const handleToggleVideos = (unitId) => {
    dispatch(toggleVideos(unitId));
    if (!videoLectures[unitId]) {
      dispatch(fetchVideoLectures({ unitId }));
    }
  };

  const handleToggleVideoMaterials = (videoId) => {
    dispatch(toggleVideoMaterials(videoId));
    if (!videoStudyMaterials[videoId]) {
      dispatch(fetchVideoStudyMaterials({ videoLectureId: videoId }));
    }
  };

  const handleActionResult = (result, successMessage, onSuccess) => {
    if (result.type.endsWith('/fulfilled')) {
      toast.success(successMessage);
      onSuccess();
      dispatch(fetchCourseUnits(courseId));
    } else {
      const errorMessage = result.payload || result.error?.message || 'Unknown error';
      toast.error(`Failed: ${errorMessage}`);
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('courseId', courseId);
    
    if (selectedFile) {
      submitData.append('image', selectedFile);
    }
    
    const result = await dispatch(createUnit(submitData));
    handleActionResult(result, 'Unit created successfully!', () => {
      setShowCreateModal(false);
      resetForm();
    });
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    
    const updateData = {
      name: formData.name,
      description: formData.description
    };
    
    const result = await dispatch(updateUnit({ id: selectedUnit.id, formData: updateData }));
    handleActionResult(result, 'Unit updated successfully!', () => {
      setShowEditModal(false);
      resetForm();
    });
  };

  const validateImageFile = (file) => {
    if (!file) return { isValid: false, error: 'No file selected' };
    if (!file.type.match('image.*')) return { isValid: false, error: 'Please select an image file' };
    if (file.size > 5 * 1024 * 1024) return { isValid: false, error: 'Image size should be less than 5MB' };
    return { isValid: true };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const validation = validateImageFile(file);
    
    if (!validation.isValid) {
      if (validation.error !== 'No file selected') {
        toast.error(validation.error);
      }
      return;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      courseId: courseId,
      image: ''
    });
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description,
      courseId: courseId
    });
    setShowEditModal(true);
  };

  const handleStatusUpdate = (unit) => {
    setSelectedUnit(unit);
    setShowStatusModal(true);
  };

  const updateStatus = async (status) => {
    const result = await dispatch(updateUnitStatus({ id: selectedUnit.id, status }));
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Unit status updated successfully!');
      setShowStatusModal(false);
      setSelectedUnit(null);
      dispatch(fetchCourseUnits(courseId));
    }
  };

  const handleUnitImageUpload = async (e, unitId) => {
    const file = e.target.files[0];
    const validation = validateImageFile(file);
    
    if (!validation.isValid) {
      if (validation.error !== 'No file selected') {
        toast.error(validation.error);
      }
      return;
    }
    
    try {
      const result = await dispatch(updateUnitImage({ id: unitId, file }));
      handleActionResult(result, 'Unit image updated successfully!', () => {});
    } catch (error) {
      toast.error('Failed to update unit image: ' + error.message);
    }
  };

  const handleCreateVideo = (unitId) => {
    setSelectedUnitForVideo(unitId);
    setVideoFormData(prev => ({ ...prev, unitId }));
    setShowVideoModal(true);
  };
  
  const handleCreateStudyMaterial = (unitId) => {
    setSelectedUnitForStudyMaterial(unitId);
    setStudyMaterialFormData(prev => ({ ...prev, unitId }));
    setShowStudyMaterialModal(true);
  };
  
  const handleCreateVideoStudyMaterial = (videoId) => {
    setSelectedVideoForStudyMaterial(videoId);
    setVideoStudyMaterialFormData(prev => ({ ...prev, videoLectureId: videoId }));
    setShowVideoStudyMaterialModal(true);
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('title', videoFormData.title);
    submitData.append('description', videoFormData.description);
    submitData.append('duration', videoFormData.duration);
    submitData.append('unitId', videoFormData.unitId);
    
    if (selectedVideoFile) {
      submitData.append('video', selectedVideoFile);
    }
    if (selectedThumbnailFile) {
      submitData.append('thumbnail', selectedThumbnailFile);
    }
    
    const result = await dispatch(createVideoLecture(submitData));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Video lecture created successfully!');
      setShowVideoModal(false);
      resetVideoForm();
      // Refresh the video lectures list for this unit
      dispatch(fetchVideoLectures({ unitId: videoFormData.unitId }));
      dispatch(fetchCourseUnits(courseId));
    }
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('video.*')) {
      toast.error('Please select a video file');
      return;
    }
    
    setSelectedVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }
    
    setSelectedThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: '',
      description: '',
      duration: 0,
      unitId: ''
    });
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };
  
  const resetStudyMaterialForm = () => {
    setStudyMaterialFormData({
      title: '',
      description: '',
      unitId: ''
    });
    setSelectedStudyFile(null);
  };
  
  const resetVideoStudyMaterialForm = () => {
    setVideoStudyMaterialFormData({
      title: '',
      description: '',
      videoLectureId: ''
    });
    setSelectedVideoStudyFile(null);
  };

  const handleVideoInputChange = (e) => {
    const { name, value } = e.target;
    setVideoFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStudyMaterialInputChange = (e) => {
    const { name, value } = e.target;
    setStudyMaterialFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStudyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedStudyFile(file);
  };
  
  const handleStudyMaterialSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('title', studyMaterialFormData.title);
    submitData.append('description', studyMaterialFormData.description);
    submitData.append('unitId', studyMaterialFormData.unitId);
    
    if (selectedStudyFile) {
      submitData.append('pdf', selectedStudyFile);
    }
    
    const result = await dispatch(createStudyMaterial(submitData));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Study material created successfully!');
      setShowStudyMaterialModal(false);
      resetStudyMaterialForm();
      // Refresh the study materials list for this unit
      dispatch(fetchStudyMaterials({ unitId: studyMaterialFormData.unitId }));
      dispatch(fetchCourseUnits(courseId));
    } else {
      toast.error('Failed to create study material: ' + (result.payload || result.error?.message || 'Unknown error'));
    }
  };
  
  const handleVideoStudyMaterialSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('title', videoStudyMaterialFormData.title);
    submitData.append('description', videoStudyMaterialFormData.description);
    submitData.append('videoLectureId', videoStudyMaterialFormData.videoLectureId);
    
    if (selectedVideoStudyFile) {
      submitData.append('pdf', selectedVideoStudyFile);
    }
    
    const result = await dispatch(createStudyMaterial(submitData));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Video study material created successfully!');
      setShowVideoStudyMaterialModal(false);
      resetVideoStudyMaterialForm();
      // Refresh the video study materials list for this video
      dispatch(fetchVideoStudyMaterials({ videoLectureId: videoStudyMaterialFormData.videoLectureId }));
      dispatch(fetchCourseUnits(courseId));
    } else {
      toast.error('Failed to create video study material: ' + (result.payload || result.error?.message || 'Unknown error'));
    }
  };
  
  const handleVideoStudyMaterialInputChange = (e) => {
    const { name, value } = e.target;
    setVideoStudyMaterialFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVideoStudyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedVideoStudyFile(file);
  };
  
  const handleEditStudyMaterial = async (e) => {
    e.preventDefault();
    
    const updateData = {
      title: selectedStudyMaterial.title,
      description: selectedStudyMaterial.description
    };
    
    const result = await dispatch(updateStudyMaterial({ id: selectedStudyMaterial.id, formData: updateData }));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('Study material updated successfully!');
      setShowEditStudyMaterialModal(false);
      setSelectedStudyMaterial(null);
      
      // Refresh study materials for unit or video
      const unitId = selectedStudyMaterial.unitId;
      const videoLectureId = selectedStudyMaterial.videoLectureId;
      
      if (unitId) {
        dispatch(fetchStudyMaterials({ unitId }));
      } else if (videoLectureId) {
        dispatch(fetchVideoStudyMaterials({ videoLectureId }));
      }
    } else {
      toast.error('Failed to update study material: ' + (result.payload || result.error?.message || 'Unknown error'));
    }
  };
  
  const handleUpdatePdf = async (e) => {
    e.preventDefault();
    
    if (!selectedEditStudyFile) {
      toast.error('Please select a PDF file');
      return;
    }
    
    const result = await dispatch(updateStudyMaterialPdf({ id: selectedStudyMaterial.id, file: selectedEditStudyFile }));
    
    if (result.type.endsWith('/fulfilled')) {
      toast.success('PDF updated successfully!');
      setShowUpdatePdfModal(false);
      setSelectedStudyMaterial(null);
      setSelectedEditStudyFile(null);
      
      // Refresh study materials for unit or video
      const unitId = selectedStudyMaterial.unitId;
      const videoLectureId = selectedStudyMaterial.videoLectureId;
      
      if (unitId) {
        dispatch(fetchStudyMaterials({ unitId }));
      } else if (videoLectureId) {
        dispatch(fetchVideoStudyMaterials({ videoLectureId }));
      }
    } else {
      toast.error('Failed to update PDF: ' + (result.payload || result.error?.message || 'Unknown error'));
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading course details...</p>
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/courses/show')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/courses/show')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 self-start"
            >
              <ArrowLeft size={18} />
              <span className="text-sm sm:text-base">Back to Courses</span>
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{courseName}</h1>
                <p className="text-sm text-gray-600">Course Units</p>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleRefresh}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Refresh
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
                >
                  <Plus size={18} /> Create Unit
                </button>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {units.length} Units
                </div>
              </div>
            </div>
          </div>
        </div>

        {units.length > 0 ? (
          <div className="space-y-4">
            {units.map((unit) => {
              console.log('Unit data:', unit);
              console.log('Unit imgUrl:', unit.imgUrl);
              const normalizedUrl = unit.imgUrl ? unit.imgUrl.replace(/\\/g, '/') : null;
              console.log('Normalized URL:', normalizedUrl);
              return (
              <div key={unit.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-blue-50 p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      <div className="flex-shrink-0 relative group">
                        {unit.imgUrl ? (
                          <img
                            src={unit.imgUrl.replace(/\\/g, '/').replace('http:/', 'http://')}
                            alt={unit.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-gray-200"
                            onError={(e) => {
                              console.log('Image failed to load:', e.target.src);
                              e.target.src = '/src/assets/default-unit.svg';
                            }}
                            onLoad={() => console.log('Image loaded successfully:', unit.imgUrl)}
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleUnitImageUpload(e, unit.id)}
                          />
                        </label>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                          {unit.name}
                        </h2>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{unit.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(unit.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleStatusUpdate(unit)}
                            className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 ${
                              unit.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : unit.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {unit.status}
                          </button>
                          <button
                            onClick={() => handleEditUnit(unit)}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUnit(unit.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-md border text-sm font-medium transition-colors self-start"
                    >
                      <span>Content</span>
                      {expandedUnits[unit.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
                
                {expandedUnits[unit.id] && (
                  <div className="p-4 space-y-3">
                    {/* Study Materials Section */}
                    <div className="border rounded-md">
                      <button
                        onClick={() => handleToggleMaterials(unit.id)}
                        className="w-full bg-blue-50 p-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen size={18} className="text-blue-600" />
                          <span className="font-medium text-gray-800">Study Materials</span>
                          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                            {studyMaterials[unit.id]?.length || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateStudyMaterial(unit.id);
                            }}
                            className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {expandedMaterials[unit.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {expandedMaterials[unit.id] && (
                        <div className="p-3 space-y-2">
                          {materialsLoading[unit.id] ? (
                            <div className="text-center py-4">
                              <RefreshCw className="animate-spin h-6 w-6 mx-auto text-blue-500" />
                              <p className="text-sm text-gray-600 mt-2">Loading materials...</p>
                            </div>
                          ) : studyMaterials[unit.id]?.length > 0 ? (
                            studyMaterials[unit.id].map((material) => (
                              <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText size={14} className="text-gray-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-gray-800 truncate">{material.title}</p>
                                    <p className="text-xs text-gray-600 truncate">{material.description}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button 
                                    onClick={() => {
                                      setSelectedStudyMaterial(material);
                                      setShowEditStudyMaterialModal(true);
                                    }}
                                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-md border border-purple-200"
                                    title="Edit Text"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSelectedStudyMaterial(material);
                                      setShowUpdatePdfModal(true);
                                    }}
                                    className="p-2 text-orange-600 hover:bg-orange-100 rounded-md border border-orange-200 bg-orange-50"
                                    title="Update PDF"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (material.fileUrl) {
                                        let normalizedUrl = material.fileUrl.replace(/\\/g, '/');
                                        if (normalizedUrl.includes('http:/') && !normalizedUrl.includes('http://')) {
                                          normalizedUrl = normalizedUrl.replace('http:/', 'http://');
                                        }
                                        console.log('Download URL:', normalizedUrl);
                                        window.open(normalizedUrl, '_blank');
                                      } else {
                                        toast.error('File URL not available');
                                      }
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200"
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (material.fileUrl) {
                                        let normalizedUrl = material.fileUrl.replace(/\\/g, '/');
                                        if (normalizedUrl.includes('http:/') && !normalizedUrl.includes('http://')) {
                                          normalizedUrl = normalizedUrl.replace('http:/', 'http://');
                                        }
                                        console.log('View URL:', normalizedUrl);
                                        window.open(normalizedUrl, '_blank');
                                      } else {
                                        toast.error('File URL not available');
                                      }
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-md border border-green-200"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <FileText size={24} className="mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No study materials found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Videos Section */}
                    <div className="border rounded-md">
                      <button
                        onClick={() => handleToggleVideos(unit.id)}
                        className="w-full bg-red-50 p-3 flex items-center justify-between hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Play size={18} className="text-red-600" />
                          <span className="font-medium text-gray-800">Video Lectures</span>
                          <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                            {videoLectures[unit.id]?.length || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateVideo(unit.id);
                            }}
                            className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {expandedVideos[unit.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {expandedVideos[unit.id] && (
                        <div className="p-3 space-y-2">
                          {videosLoading[unit.id] ? (
                            <div className="text-center py-4">
                              <RefreshCw className="animate-spin h-6 w-6 mx-auto text-red-500" />
                              <p className="text-sm text-gray-600 mt-2">Loading videos...</p>
                            </div>
                          ) : videoLectures[unit.id]?.length > 0 ? (
                            videoLectures[unit.id].map((video) => (
                              <div key={video.id} className="border rounded-md mb-2">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-md">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                      <img
                                        src={video.thumbnailUrl?.replace(/\\/g, '/').replace('http:/', 'http://')}
                                        alt={video.title}
                                        className="w-12 h-8 rounded object-cover bg-gray-200"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm text-gray-800 truncate">{video.title}</p>
                                      <p className="text-xs text-gray-600 truncate">{video.description}</p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Duration: {video.duration} min</span>
                                        <span>•</span>
                                        <span>Unit: {video.unit?.name}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {video.videoUrl && (
                                      <button 
                                        onClick={() => window.open(video.videoUrl.replace(/\\/g, '/').replace('http:/', 'http://'), '_blank')}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                        title="Play Video"
                                      >
                                        <Play size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => window.open(video.thumbnailUrl?.replace(/\\/g, '/').replace('http:/', 'http://'), '_blank')}
                                      className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                                      title="View Thumbnail"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleToggleVideoMaterials(video.id)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Study Materials"
                                    >
                                      <FileText size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateVideoStudyMaterial(video.id);
                                      }}
                                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                                      title="Add Study Material"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </div>
                                {expandedVideoMaterials[video.id] && (
                                  <div className="p-3 bg-white border-t">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText size={16} className="text-blue-600" />
                                      <span className="font-medium text-sm text-gray-800">Study Materials</span>
                                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                        {videoStudyMaterials[video.id]?.length || 0}
                                      </span>
                                    </div>
                                    {videoMaterialsLoading[video.id] ? (
                                      <div className="text-center py-2">
                                        <RefreshCw className="animate-spin h-4 w-4 mx-auto text-blue-500" />
                                        <p className="text-xs text-gray-600 mt-1">Loading materials...</p>
                                      </div>
                                    ) : videoStudyMaterials[video.id]?.length > 0 ? (
                                      <div className="space-y-1">
                                        {videoStudyMaterials[video.id].map((material) => (
                                          <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <FileText size={12} className="text-gray-600 flex-shrink-0" />
                                              <div className="min-w-0 flex-1">
                                                <p className="font-medium text-xs text-gray-800 truncate">{material.title}</p>
                                                <p className="text-xs text-gray-600 truncate">{material.description}</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <button 
                                                onClick={() => {
                                                  setSelectedStudyMaterial(material);
                                                  setShowEditStudyMaterialModal(true);
                                                }}
                                                className="p-1 text-purple-600 hover:bg-purple-100 rounded border border-purple-200"
                                                title="Edit Text"
                                              >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  setSelectedStudyMaterial(material);
                                                  setShowUpdatePdfModal(true);
                                                }}
                                                className="p-1 text-orange-600 hover:bg-orange-100 rounded border border-orange-200 bg-orange-50"
                                                title="Update PDF"
                                              >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                </svg>
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  if (material.fileUrl) {
                                                    let normalizedUrl = material.fileUrl.replace(/\\/g, '/');
                                                    if (normalizedUrl.includes('http:/') && !normalizedUrl.includes('http://')) {
                                                      normalizedUrl = normalizedUrl.replace('http:/', 'http://');
                                                    }
                                                    console.log('Video Material Download URL:', normalizedUrl);
                                                    window.open(normalizedUrl, '_blank');
                                                  } else {
                                                    toast.error('File URL not available');
                                                  }
                                                }}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                title="Download"
                                              >
                                                <Download size={12} />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  if (material.fileUrl) {
                                                    let normalizedUrl = material.fileUrl.replace(/\\/g, '/');
                                                    if (normalizedUrl.includes('http:/') && !normalizedUrl.includes('http://')) {
                                                      normalizedUrl = normalizedUrl.replace('http:/', 'http://');
                                                    }
                                                    console.log('Video Material View URL:', normalizedUrl);
                                                    window.open(normalizedUrl, '_blank');
                                                  } else {
                                                    toast.error('File URL not available');
                                                  }
                                                }}
                                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                title="View"
                                              >
                                                <Eye size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 text-gray-500">
                                        <FileText size={16} className="mx-auto mb-1 text-gray-300" />
                                        <p className="text-xs">No study materials found</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Play size={24} className="mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No video lectures found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-2">No Units Found</h3>
            <p className="text-sm sm:text-base text-gray-600">This course doesn't have any units yet.</p>
          </div>
        )}
      </div>

      {/* Create Unit Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Unit"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUnit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Introduction to Programming"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Basic programming concepts and fundamentals"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Image</label>
                    
                    {imagePreview ? (
                      <div className="relative mb-3">
                        <img 
                          src={imagePreview} 
                          alt="Unit preview" 
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                        >
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
                            <p className="text-xs text-gray-500">Upload Image</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            accept="image/*"
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={unitLoading}
                  >
                    {unitLoading ? 'Creating...' : 'Create Unit'}
                  </button>
                </div>
              </form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal 
        isOpen={showEditModal && selectedUnit} 
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Unit"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateUnit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Introduction to Programming"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Basic programming concepts and fundamentals"
                    />
                  </div>
                  

                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={unitLoading}
                  >
                    {unitLoading ? 'Updating...' : 'Update Unit'}
                  </button>
                </div>
              </form>
      </Modal>

      {/* Unit Status Update Modal */}
      {showStatusModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Update Unit Status</h3>
              <p className="text-gray-600 mb-4">Unit: {selectedUnit.name}</p>
              <p className="text-sm text-gray-500 mb-6">Current Status: {selectedUnit.status}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => updateStatus('PENDING')}
                  className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  Set as Pending
                </button>
                <button
                  onClick={() => updateStatus('ACTIVE')}
                  className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  Set as Active
                </button>
                <button
                  onClick={() => updateStatus('DEACTIVE')}
                  className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  Set as Deactive
                </button>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedUnit(null);
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

      {/* Create Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Video Lecture</h2>
              
              <form onSubmit={handleVideoSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={videoFormData.title}
                      onChange={handleVideoInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Introduction to JavaScript"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={videoFormData.duration}
                      onChange={handleVideoInputChange}
                      required
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="30"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={videoFormData.description}
                      onChange={handleVideoInputChange}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Basic JavaScript concepts and fundamentals"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="video-file-input" className="block text-sm font-medium text-gray-700 mb-1">Video File *</label>
                    {videoPreview ? (
                      <div className="relative mb-3">
                        <video 
                          src={videoPreview} 
                          className="w-full h-32 object-cover rounded-md"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVideoPreview(null);
                            setSelectedVideoFile(null);
                            if (videoInputRef.current) videoInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="video-file-input" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <Play className="w-6 h-6 mb-2 text-gray-500" />
                            <p className="text-xs text-gray-500">Upload Video</p>
                          </div>
                          <input 
                            id="video-file-input"
                            type="file" 
                            className="hidden" 
                            onChange={handleVideoFileUpload}
                            accept="video/*"
                            ref={videoInputRef}
                            required
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="thumbnail-file-input" className="block text-sm font-medium text-gray-700 mb-1">Thumbnail *</label>
                    {thumbnailPreview ? (
                      <div className="relative mb-3">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnailPreview(null);
                            setSelectedThumbnailFile(null);
                            if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="thumbnail-file-input" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <svg className="w-6 h-6 mb-2 text-gray-500" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="text-xs text-gray-500">Upload Thumbnail</p>
                          </div>
                          <input 
                            id="thumbnail-file-input"
                            type="file" 
                            className="hidden" 
                            onChange={handleThumbnailUpload}
                            accept="image/*"
                            ref={thumbnailInputRef}
                            required
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoModal(false);
                      resetVideoForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={videoLoading}
                  >
                    {videoLoading ? 'Creating...' : 'Add Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Study Material Modal */}
      {showStudyMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Study Material</h2>
              
              <form onSubmit={handleStudyMaterialSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="study-material-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      id="study-material-title"
                      type="text"
                      name="title"
                      value={studyMaterialFormData.title}
                      onChange={handleStudyMaterialInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Newton Worksheet"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="study-material-description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      id="study-material-description"
                      name="description"
                      value={studyMaterialFormData.description}
                      onChange={handleStudyMaterialInputChange}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Practice problems for calculus"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="study-material-file" className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="study-material-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <FileText className="w-6 h-6 mb-2 text-gray-500" />
                          <p className="text-xs text-gray-500">
                            {selectedStudyFile ? selectedStudyFile.name : 'Upload File'}
                          </p>
                        </div>
                        <input 
                          id="study-material-file"
                          type="file" 
                          className="hidden" 
                          onChange={handleStudyFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudyMaterialModal(false);
                      resetStudyMaterialForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={studyMaterialLoading}
                  >
                    {studyMaterialLoading ? 'Creating...' : 'Add Study Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Video Study Material Modal */}
      {showVideoStudyMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Video Study Material</h2>
              
              <form onSubmit={handleVideoStudyMaterialSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="video-study-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      id="video-study-title"
                      type="text"
                      name="title"
                      value={videoStudyMaterialFormData.title}
                      onChange={handleVideoStudyMaterialInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Newton Worksheet"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="video-study-description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      id="video-study-description"
                      name="description"
                      value={videoStudyMaterialFormData.description}
                      onChange={handleVideoStudyMaterialInputChange}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Practice problems for calculus"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="video-study-file" className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="video-study-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <FileText className="w-6 h-6 mb-2 text-gray-500" />
                          <p className="text-xs text-gray-500">
                            {selectedVideoStudyFile ? selectedVideoStudyFile.name : 'Upload File'}
                          </p>
                        </div>
                        <input 
                          id="video-study-file"
                          type="file" 
                          className="hidden" 
                          onChange={handleVideoStudyFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoStudyMaterialModal(false);
                      resetVideoStudyMaterialForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={studyMaterialLoading}
                  >
                    {studyMaterialLoading ? 'Creating...' : 'Add Study Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Study Material Modal */}
      {showEditStudyMaterialModal && selectedStudyMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Study Material</h2>
              
              <form onSubmit={handleEditStudyMaterial}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-study-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      id="edit-study-title"
                      type="text"
                      value={selectedStudyMaterial.title}
                      onChange={(e) => setSelectedStudyMaterial(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Newton Worksheet"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-study-description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      id="edit-study-description"
                      value={selectedStudyMaterial.description}
                      onChange={(e) => setSelectedStudyMaterial(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Practice problems for calculus"
                    />
                  </div>
                  

                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStudyMaterialModal(false);
                      setSelectedStudyMaterial(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={studyMaterialLoading}
                  >
                    {studyMaterialLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Update PDF Modal */}
      {showUpdatePdfModal && selectedStudyMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Update PDF File</h2>
              <p className="text-sm text-gray-600 mb-4">Material: {selectedStudyMaterial.title}</p>
              
              <form onSubmit={handleUpdatePdf}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="update-pdf-file" className="block text-sm font-medium text-gray-700 mb-1">Select New PDF File *</label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="update-pdf-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <FileText className="w-6 h-6 mb-2 text-gray-500" />
                          <p className="text-xs text-gray-500">
                            {selectedEditStudyFile ? selectedEditStudyFile.name : 'Choose PDF file'}
                          </p>
                        </div>
                        <input 
                          id="update-pdf-file"
                          type="file" 
                          className="hidden" 
                          onChange={(e) => setSelectedEditStudyFile(e.target.files[0])}
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdatePdfModal(false);
                      setSelectedStudyMaterial(null);
                      setSelectedEditStudyFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                    disabled={studyMaterialLoading}
                  >
                    {studyMaterialLoading ? 'Updating...' : 'Update PDF'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;