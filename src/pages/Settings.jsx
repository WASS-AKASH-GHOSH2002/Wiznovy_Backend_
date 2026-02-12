import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Settings as SettingsIcon, Upload, Save, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_domain: '',
    admin_domain: '',
    mobile_domain: '',
    facebook: '',
    linkedIn: '',
    twitter: '',
    instagram: '',
    whatsApp: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [homeFile, setHomeFile] = useState(null);

  const getAuthToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/settings/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.result && response.data.result.length > 0) {
        const settingsData = response.data.result[0];
        setSettings(settingsData);
        setFormData({
          user_domain: settingsData.user_domain || '',
          admin_domain: settingsData.admin_domain || '',
          mobile_domain: settingsData.mobile_domain || '',
          facebook: settingsData.facebook || '',
          linkedIn: settingsData.linkedIn || '',
          twitter: settingsData.twitter || '',
          instagram: settingsData.instagram || '',
          whatsApp: settingsData.whatsApp || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.patch(`${API_BASE_URL}/settings/update`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        toast.success('Settings updated successfully');
        fetchSettings();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', logoFile);

      const response = await axios.put(`${API_BASE_URL}/settings/logo`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        toast.success('Logo updated successfully');
        fetchSettings();
        setLogoFile(null);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleHomeImageUpload = async () => {
    if (!homeFile) {
      toast.error('Please select a home image file');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', homeFile);

      const response = await axios.put(`${API_BASE_URL}/settings/home`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        toast.success('Home image updated successfully');
        fetchSettings();
        setHomeFile(null);
      }
    } catch (error) {
      console.error('Error uploading home image:', error);
      toast.error('Failed to upload home image');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // <div className="p-6 max-w-4xl mx-auto">
    //   <div className="flex items-center gap-3 mb-6">
    //     <SettingsIcon className="h-8 w-8 text-blue-600" />
    //     <h1 className="text-3xl font-bold text-gray-800">Settings Management</h1>
    //   </div>

    //   {/* Current Settings Display */}
    //   {settings && (
    //     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    //       <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    //         <Eye className="h-5 w-5" />
    //         Current Settings
    //       </h2>
    //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //         <div>
    //           <p className="text-sm text-gray-600">User Domain</p>
    //           {settings.user_domain ? (
    //             <a href={settings.user_domain} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800 underline">
    //               {settings.user_domain}
    //             </a>
    //           ) : (
    //             <p className="font-medium">Not set</p>
    //           )}
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">Admin Domain</p>
    //           {settings.admin_domain ? (
    //             <a href={settings.admin_domain} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800 underline">
    //               {settings.admin_domain}
    //             </a>
    //           ) : (
    //             <p className="font-medium">Not set</p>
    //           )}
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">Mobile Domain</p>
    //           {settings.mobile_domain ? (
    //             <a href={settings.mobile_domain} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800 underline">
    //               {settings.mobile_domain}
    //             </a>
    //           ) : (
    //             <p className="font-medium">Not set</p>
    //           )}
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">Facebook</p>
    //           <p className="font-medium">{settings.facebook || 'Not set'}</p>
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">LinkedIn</p>
    //           <p className="font-medium">{settings.linkedIn || 'Not set'}</p>
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">Twitter</p>
    //           <p className="font-medium">{settings.twitter || 'Not set'}</p>
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">Instagram</p>
    //           <p className="font-medium">{settings.instagram || 'Not set'}</p>
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600">WhatsApp</p>
    //           <p className="font-medium">{settings.whatsApp || 'Not set'}</p>
    //         </div>
    //       </div>
          
    //       {/* Current Images */}
    //       <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    //         <div>
    //           <p className="text-sm text-gray-600 mb-2">Current Logo</p>
    //           {settings.logo ? (
    //             <img src={settings.logo} alt="Logo" className="w-32 h-32 object-contain border rounded-lg" />
    //           ) : (
    //             <p className="text-gray-500">No logo uploaded</p>
    //           )}
    //         </div>
    //         <div>
    //           <p className="text-sm text-gray-600 mb-2">Current Home Page Image</p>
    //           {settings.homePageUrl ? (
    //             <img src={settings.homePageUrl} alt="Home Page" className="w-32 h-32 object-contain border rounded-lg" />
    //           ) : (
    //             <p className="text-gray-500">No home image uploaded</p>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   )}

    //   {/* Add/Update Settings Form */}
    //   <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    //     <h2 className="text-xl font-semibold mb-4">
    //       Update Settings
    //     </h2>
    //     <form onSubmit={handleUpdateSettings} className="space-y-4">
    //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             User Domain
    //           </label>
    //           <input
    //             type="url"
    //             name="user_domain"
    //             value={formData.user_domain}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Admin Domain
    //           </label>
    //           <input
    //             type="url"
    //             name="admin_domain"
    //             value={formData.admin_domain}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Mobile Domain
    //           </label>
    //           <input
    //             type="text"
    //             name="mobile_domain"
    //             value={formData.mobile_domain}
    //             onChange={handleInputChange}
    //             maxLength={150}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Facebook
    //           </label>
    //           <input
    //             type="text"
    //             name="facebook"
    //             value={formData.facebook}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             LinkedIn
    //           </label>
    //           <input
    //             type="text"
    //             name="linkedIn"
    //             value={formData.linkedIn}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Twitter
    //           </label>
    //           <input
    //             type="text"
    //             name="twitter"
    //             value={formData.twitter}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             Instagram
    //           </label>
    //           <input
    //             type="text"
    //             name="instagram"
    //             value={formData.instagram}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //         <div>
    //           <label className="block text-sm font-medium text-gray-700 mb-2">
    //             WhatsApp
    //           </label>
    //           <input
    //             type="text"
    //             name="whatsApp"
    //             value={formData.whatsApp}
    //             onChange={handleInputChange}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //           />
    //         </div>
    //       </div>
    //       <button
    //         type="submit"
    //         disabled={loading}
    //         className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
    //       >
    //         <Save className="h-4 w-4" />
    //         {loading ? 'Updating...' : 'Update Settings'}
    //       </button>
    //     </form>
    //   </div>

    //   {/* Logo Upload Section */}
    //   <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    //     <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    //       <Upload className="h-5 w-5" />
    //       Logo Upload
    //     </h2>
    //     <div className="space-y-4">
    //       <div>
    //         <label className="block text-sm font-medium text-gray-700 mb-2">
    //           Select Logo File
    //         </label>
    //         <input
    //           type="file"
    //           accept="image/*"
    //           onChange={(e) => setLogoFile(e.target.files[0])}
    //           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //         />
    //       </div>
    //       <button
    //         onClick={handleLogoUpload}
    //         disabled={loading || !logoFile}
    //         className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
    //       >
    //         <Upload className="h-4 w-4" />
    //         {loading ? 'Uploading...' : 'Upload Logo'}
    //       </button>
    //     </div>
    //   </div>

    //   {/* Home Image Upload Section */}
    //   <div className="bg-white rounded-lg shadow-md p-6">
    //     <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    //       <Upload className="h-5 w-5" />
    //       Home Image Upload
    //     </h2>
    //     <div className="space-y-4">
    //       <div>
    //         <label className="block text-sm font-medium text-gray-700 mb-2">
    //           Select Home Image File
    //         </label>
    //         <input
    //           type="file"
    //           accept="image/*"
    //           onChange={(e) => setHomeFile(e.target.files[0])}
    //           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    //         />
    //       </div>
    //       <button
    //         onClick={handleHomeImageUpload}
    //         disabled={loading || !homeFile}
    //         className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
    //       >
    //         <Upload className="h-4 w-4" />
    //         {loading ? 'Uploading...' : 'Upload Home Image'}
    //       </button>
    //     </div>
    //   </div>
    // </div>
    <h1>Settings Management Coming Soon</h1>
  );
};

export default Settings;