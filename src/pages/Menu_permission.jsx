import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const UserPermissionsPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userPermissions, setUserPermissions] = useState({});

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/account/staff/profile/${accountId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setMessage("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };
    
    if (accountId) {
      fetchUser();
    }
  }, [accountId]);

  // Fetch all menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const res = await api.get('/menus');
        setMenus(res.data?.result || res.data || []);
      } catch (err) {
        console.error("Error fetching menus:", err);
        setMessage("Failed to load menus.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // Fetch permissions for each menu
  const fetchUserPermissions = async () => {
    if (!accountId || menus.length === 0) return;
    
    try {
      setLoading(true);
      const permissionsObj = {};
      
      // Fetch permissions for each menu
      for (const menu of menus) {
        try {
          const res = await api.get(`/user-permissions/${menu.id}/${accountId}`);
          const permissions = res.data?.result || [];
          
          permissionsObj[menu.id] = {
            read: { status: false, id: null },
            write: { status: false, id: null }, 
            update: { status: false, id: null },
            delete: { status: false, id: null }
          };
          
          permissions.forEach(perm => {
            switch (perm.permissionId) {
              case 1: permissionsObj[menu.id].write = { status: perm.status, id: perm.id }; break;
              case 2: permissionsObj[menu.id].read = { status: perm.status, id: perm.id }; break;
              case 3: permissionsObj[menu.id].update = { status: perm.status, id: perm.id }; break;
              case 4: permissionsObj[menu.id].delete = { status: perm.status, id: perm.id }; break;
            }
          });
        } catch (err) {
          // Initialize empty permissions if none exist
          permissionsObj[menu.id] = {
            read: { status: false, id: null },
            write: { status: false, id: null },
            update: { status: false, id: null }, 
            delete: { status: false, id: null }
          };
        }
      }
      
      setUserPermissions(permissionsObj);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setMessage("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions when accountId and menus are available
  useEffect(() => {
    if (accountId && menus.length > 0) {
      fetchUserPermissions();
    }
  }, [accountId, menus]);

  // Handle permission change
  const handlePermissionChange = (menuId, permissionType) => {
    setUserPermissions(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [permissionType]: {
          ...prev[menuId]?.[permissionType],
          status: !prev[menuId]?.[permissionType]?.status
        }
      }
    }));
  };

  // Save all permissions using bulk update
  const saveAllPermissions = async () => {
    try {
      setLoading(true);
      
      const menuArray = [];
      
      Object.keys(userPermissions).forEach(menuId => {
        const menuPerms = userPermissions[menuId];
        const userPermissionArray = [];
        
        const permissionTypes = [
          { type: 'write', id: 1 },
          { type: 'read', id: 2 },
          { type: 'update', id: 3 },
          { type: 'delete', id: 4 }
        ];
        
        permissionTypes.forEach(({ type, id }) => {
          userPermissionArray.push({
            id: menuPerms[type]?.id || 0,
            accountId: accountId,
            menuId: Number.parseInt(menuId, 10),
            permissionId: id,
            status: menuPerms[type]?.status || false,
            permission: { id: id }
          });
        });
        
        menuArray.push({
          id: Number.parseInt(menuId, 10),
          userPermission: userPermissionArray
        });
      });
      
      const requestData = { menu: menuArray };
      
      // Use any ID (backend doesn't use this param, just needs it in URL)
      const response = await api.put(`/user-permissions/1`, requestData);
      
      setMessage("✅ All permissions saved successfully!");
      await fetchUserPermissions();
      
    } catch (err) {
      console.error("Error saving permissions:", err);
      setMessage("❌ Failed to save permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual permission status
  const togglePermissionStatus = async (menuId, permissionType) => {
    handlePermissionChange(menuId, permissionType);
  };

  // Toggle all permissions for a menu
  const toggleAllPermissions = (menuId) => {
    const menuPerms = userPermissions[menuId];
    const allChecked = menuPerms?.read?.status && menuPerms?.write?.status && menuPerms?.update?.status && menuPerms?.delete?.status;
    
    setUserPermissions(prev => ({
      ...prev,
      [menuId]: {
        read: { ...prev[menuId]?.read, status: !allChecked },
        write: { ...prev[menuId]?.write, status: !allChecked },
        update: { ...prev[menuId]?.update, status: !allChecked },
        delete: { ...prev[menuId]?.delete, status: !allChecked }
      }
    }));
  };

  // Check if all permissions are selected for a menu
  const isAllSelected = (menuId) => {
    const menuPerms = userPermissions[menuId];
    return menuPerms?.read?.status && menuPerms?.write?.status && menuPerms?.update?.status && menuPerms?.delete?.status;
  };

  // Toggle all permissions for all menus
  const toggleGlobalPermissions = () => {
    const allSelected = isGlobalAllSelected();
    
    setUserPermissions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(menuId => {
        updated[menuId] = {
          read: { ...updated[menuId]?.read, status: !allSelected },
          write: { ...updated[menuId]?.write, status: !allSelected },
          update: { ...updated[menuId]?.update, status: !allSelected },
          delete: { ...updated[menuId]?.delete, status: !allSelected }
        };
      });
      return updated;
    });
  };

  // Check if all permissions for all menus are selected
  const isGlobalAllSelected = () => {
    return Object.keys(userPermissions).length > 0 && Object.keys(userPermissions).every(menuId => isAllSelected(menuId));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            User Permissions Management
          </h2>
          <div className="flex gap-2">
            <button
              onClick={saveAllPermissions}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300"
            >
              {loading ? "Saving..." : "Save All Permissions"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Back to Staff
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-medium ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                  {user.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show message */}
        {message && (
          <p className={`text-sm mb-4 ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        {/* Permissions List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Menu Permissions</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="global-select-all"
                  checked={isGlobalAllSelected()}
                  onChange={toggleGlobalPermissions}
                  className="h-5 w-5 text-green-600 rounded"
                  disabled={loading}
                />
                <label htmlFor="global-select-all" className="text-sm font-medium text-green-600">
                  Select All Menus
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {menus.length} menu(s) found
            </p>
          </div>
          
          {loading && menus.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : menus.length > 0 ? (
            <div className="space-y-4">
              {menus.map((menu) => (
                <div key={menu.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-lg">{menu.name}</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`select-all-${menu.id}`}
                        checked={isAllSelected(menu.id)}
                        onChange={() => toggleAllPermissions(menu.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                        disabled={loading}
                      />
                      <label htmlFor={`select-all-${menu.id}`} className="text-sm font-medium text-blue-600">
                        Select All
                      </label>
                      <span className="text-sm text-gray-500">ID: {menu.id}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { type: 'read', label: 'Read', id: 2 },
                      { type: 'write', label: 'Write', id: 1 },
                      { type: 'update', label: 'Update', id: 3 },
                      { type: 'delete', label: 'Delete', id: 4 }
                    ].map(({ type, label, id }) => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${type}-${menu.id}`}
                          checked={userPermissions[menu.id]?.[type]?.status || false}
                          onChange={() => togglePermissionStatus(menu.id, type)}
                          className="h-4 w-4 text-blue-600 rounded"
                          disabled={loading}
                        />
                        <label htmlFor={`${type}-${menu.id}`} className="ml-2 text-sm text-gray-700">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Menu ID: {menu.id}
                    </span>
                    <span className="text-sm text-gray-500">
                      User ID: {accountId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No menus found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsPage;