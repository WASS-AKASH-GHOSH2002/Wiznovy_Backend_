import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Edit, Trash2, RefreshCw, Plus } from "lucide-react";
import { fetchPages, createPage, updatePage, updatePageDetails, deletePage, setSearch, setPageTypeFilter } from "../store/pageSlice";
import { validateImageFile } from '../utils/fileValidation';
import { normalizeImageUrl } from '../utils/imageUtils';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const PageManager = () => {
  const dispatch = useDispatch();
  const { pages, total, loading, error, filters } = useSelector(state => state.pages);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUpdateTextModal, setShowUpdateTextModal] = useState(false);
  const [showUpdateImageModal, setShowUpdateImageModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    title: '',
    pageType: 'USER',
    desc: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchPages({ limit: itemsPerPage, offset, keyword: filters.search, pageType: filters.pageType }));
  }, [dispatch, currentPage, itemsPerPage, filters.search, filters.pageType]);

  const handleView = (page) => {
    setSelectedPage(page);
    setShowViewModal(true);
  };

  const handleEdit = (page) => {
    setSelectedPage(page);
    setFormData({
      title: page.title,
      pageType: page.pageType,
      desc: page.desc
    });
    if (page.imageUrl) {
      setImagePreview(page.imageUrl);
    }
    setShowEditForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      const result = await dispatch(deletePage(id));
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Page deleted successfully!');
        const offset = (currentPage - 1) * itemsPerPage;
        dispatch(fetchPages({ limit: itemsPerPage, offset, keyword: filters.search, pageType: filters.pageType }));
      } else {
        toast.error('Failed to delete page');
      }
    }
  };

  const handleRefresh = () => {
    const offset = (currentPage - 1) * itemsPerPage;
    dispatch(fetchPages({ 
      limit: itemsPerPage,
      offset,
      keyword: filters.search, 
      pageType: filters.pageType 
    }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    dispatch(fetchPages({ 
      limit: itemsPerPage,
      offset: 0,
      keyword: filters.search, 
      pageType: filters.pageType 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.desc.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.desc.trim().length < 50) {
      toast.error('Description must be at least 50 characters long');
      return;
    }
    
    // Check for duplicate page name (only for create, not edit)
    if (!showEditForm) {
      const existingPage = pages.find(page => 
        page.title.toLowerCase().trim() === formData.title.toLowerCase().trim()
      );
      if (existingPage) {
        toast.error('Page already exists with this name');
        return;
      }
    }
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('pageType', formData.pageType);
    submitData.append('desc', formData.desc);
    
    const imageFile = selectedImageFile || fileInputRef.current?.files[0];
    if (imageFile) {
      submitData.append('file', imageFile);
    }
    
      let result;
      if (showEditForm && selectedPage) {
        result = await dispatch(updatePage({ id: selectedPage.id, pageData: submitData }));
        if (result.type.endsWith('/fulfilled')) {
          toast.success('Page updated successfully!');
          setShowEditForm(false);
        } else {
          toast.error('Failed to update page');
          return;
        }
      } else {
        result = await dispatch(createPage(submitData));
        if (result.type.endsWith('/fulfilled')) {
          toast.success('Page created successfully!');
          setShowCreateForm(false);
        } else {
          toast.error('Failed to create page');
          return;
        }
      }
      
      resetForm();
      const offset = (currentPage - 1) * itemsPerPage;
      dispatch(fetchPages({ limit: itemsPerPage, offset, keyword: filters.search, pageType: filters.pageType }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateText = async () => {
    if (!formData.title.trim() || !formData.desc.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.desc.trim().length < 50) {
      toast.error('Description must be at least 50 characters long');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const submitData = {
        title: formData.title,
        pageType: formData.pageType,
        desc: formData.desc
      };
      
      const result = await dispatch(updatePageDetails({ id: selectedPage.id, pageData: submitData }));
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Page text updated successfully!');
        setShowUpdateTextModal(false);
        resetForm();
        const offset = (currentPage - 1) * itemsPerPage;
        dispatch(fetchPages({ limit: itemsPerPage, offset, keyword: filters.search, pageType: filters.pageType }));
      } else {
        toast.error('Failed to update page text');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateImage = async () => {
    const imageFile = selectedImageFile || fileInputRef.current?.files[0];
    if (!imageFile) return;
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('file', imageFile);
      
      const result = await dispatch(updatePage({ id: selectedPage.id, pageData: submitData }));
      if (result.type.endsWith('/fulfilled')) {
        toast.success('Page image updated successfully!');
        setShowUpdateImageModal(false);
        resetForm();
        const offset = (currentPage - 1) * itemsPerPage;
        dispatch(fetchPages({ limit: itemsPerPage, offset, keyword: filters.search, pageType: filters.pageType }));
      } else {
        toast.error('Failed to update page image');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', pageType: 'USER', desc: '' });
    setImagePreview(null);
    setSelectedImageFile(null);
    setSelectedPage(null);
    setShowCreateForm(false);
    setShowEditForm(false);
    setShowUpdateTextModal(false);
    setShowUpdateImageModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
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

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Loading pages...</p>
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
          <h2 className="text-3xl font-bold text-gray-800">Page Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} /> Add Page
            </button>
            <button
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">Total Pages: {total || 0}</p>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by page title..."
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="flex-1 border border-gray-300 p-2.5 rounded-lg"
          />
          <select
            value={filters.pageType}
            onChange={(e) => dispatch(setPageTypeFilter(e.target.value))}
            className="border border-gray-300 p-2.5 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="USER">User</option>
            <option value="TUTOR">Tutor</option>
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
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Page Type</th>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Created At</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, index) => (
                <tr key={page.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-4 font-medium">{page.title}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      page.pageType === "USER" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}>
                      {page.pageType}
                    </span>
                  </td>
                  <td className="p-4">
                    {page.imageUrl ? (
                      <img 
                        src={normalizeImageUrl(page.imageUrl)} 
                        alt={page.title} 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(page.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(page)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPage(page);
                          setFormData({
                            title: page.title,
                            pageType: page.pageType,
                            desc: page.desc
                          });
                          setShowUpdateTextModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Update Text"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPage(page);
                          setShowUpdateImageModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                        title="Update Image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Page"
                      >
                        <Trash2 size={18} />
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total || 0)} of {total || 0} pages
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
                Page {currentPage} of {Math.ceil((total || 0) / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil((total || 0) / itemsPerPage)}
                className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showCreateForm || showEditForm} 
        onClose={resetForm}
        title={showEditForm ? 'Edit Page' : 'Add New Page'}
        maxWidth="max-w-2xl"
      >
        <div className="max-h-96 overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    id="pageTitle"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    placeholder="Enter page title"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 mb-2">
                    Page Type *
                  </label>
                  <select
                    id="pageType"
                    value={formData.pageType}
                    onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                    required
                  >
                    <option value="USER">User</option>
                    <option value="TUTOR">Tutor</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="pageImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Page Image
                  {fileInputRef.current?.files[0] && (
                    <span className="ml-2 text-green-600 text-xs">✓ File selected</span>
                  )}
                </label>
                
                {imagePreview ? (
                  <div className="relative mb-3">
                    <img 
                      src={imagePreview} 
                      alt="Page preview" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
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
                        id="pageImage"
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
              <div className="mb-4">
                <label htmlFor="pageDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="pageDescription"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Enter page description (minimum 50 characters)"
                  rows={8}
                  minLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.desc.length}/50 characters minimum
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                {showEditForm ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setShowEditForm(false); setShowUpdateTextModal(true); }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Update Text
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditForm(false); setShowUpdateImageModal(true); }}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Update Image
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : 'Create Page'}
                  </button>
                )}
              </div>
            </form>
        </div>
      </Modal>

      <Modal 
        isOpen={showUpdateTextModal && selectedPage} 
        onClose={() => setShowUpdateTextModal(false)}
        title="Update Page Text"
        maxWidth="max-w-md"
        position="center"
      >
        {selectedPage && (
            <>
            <div className="space-y-4">
              <div>
                <label htmlFor="updateTitle" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  id="updateTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="updatePageType" className="block text-sm font-medium text-gray-700 mb-2">Page Type *</label>
                <select
                  id="updatePageType"
                  value={formData.pageType}
                  onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value="USER">User</option>
                  <option value="TUTOR">Tutor</option>
                </select>
              </div>
              <div>
                <label htmlFor="updateDescription" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  id="updateDescription"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  rows={4}
                  minLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.desc.length}/50 characters minimum
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowUpdateTextModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateText}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : 'Update Text'}
              </button>
            </div>
            </>
        )}
      </Modal>

      <Modal 
        isOpen={showUpdateImageModal && selectedPage} 
        onClose={() => setShowUpdateImageModal(false)}
        title="Update Page Image"
        maxWidth="max-w-md"
        position="center"
      >
        {selectedPage && (
            <>
            <div className="mb-4">
              <label htmlFor="updateImage" className="block text-sm font-medium text-gray-700 mb-2">Select New Image</label>
              <input 
                id="updateImage"
                type="file" 
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUpdateImageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateImage}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                disabled={!selectedImageFile || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : 'Update Image'}
              </button>
            </div>
            </>
        )}
      </Modal>

      <Modal 
        isOpen={showViewModal && selectedPage} 
        onClose={() => {
          setShowViewModal(false);
          setSelectedPage(null);
        }}
        title="Page Details"
        maxWidth="max-w-4xl"
        position="center"
      >
        {selectedPage && (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="text-gray-900 font-medium">{selectedPage.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Page Type</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedPage.pageType === "USER" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                }`}>
                  {selectedPage.pageType}
                </span>
              </div>
              {selectedPage.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <img src={normalizeImageUrl(selectedPage.imageUrl)} alt={selectedPage.title} className="w-32 h-32 object-cover rounded-lg" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedPage.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{new Date(selectedPage.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated At</label>
                  <p className="text-gray-900">{new Date(selectedPage.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedPage(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PageManager;