import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/auth/authThunks";
import WiznovyLogo from "../assets/WIZNOVY.png";
import LazyImage from "./LazyImage";
import axios from "axios";
import { toast } from 'react-toastify';
import {
  User,
  Users,
  Laptop,
  Home,
  Settings,
  MessageCircle,
  Newspaper,
  QrCode,
  ChevronDown,
  ChevronUp,
  PcCase,
  ShieldCheck,
  LogOut,
  Search,
  X,
  BookCopy,
  MapPin,
  BookOpen,
  ListStart,
  SquareKanban
} from "lucide-react";

import FacultyArea from "./FacultyArea";
import AllFaculty from "./AllFaculty";
import UserManagement from "../pages/UserManagement";




import CouponManager from "../pages/CouponManager";
import CourseManager from "../pages/CourseManager";

import FaqManager from "../pages/FaqSection";
import ContactUsAdmin from "../pages/Contact_us";
import AdminFeedback from "../pages/Feedback";
import { API_BASE_URL } from "../config/api";
import NotificationManager from "../pages/NotificationManager";
import SettingsPage from "../pages/Settings";

import Menu_permission from "../pages/Menu_permission";
import Tutormanagement from "../pages/Tutormanagement";
import CountryManagement from "../pages/CountryManagement";
import StateManagement from "../pages/StateManagement";
import SubjectsNew from "../pages/SubjectNew";
import CourseDetails from "../pages/CourseDetails";
import GoalManager from "../pages/GoalManager";
import TopicManager from "../pages/TopicManager";
import LanguageManager from "../pages/LanguageManager";
import PageManager from "../pages/PageManager";
import EducationalLevelManager from "../pages/EducationalLevelManager";
import CityManager from "../pages/CityManager";


const totalCourses = 4;
const totalLectures = 1;

const getStats = (facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount) => [
  {
    title: "All Users",
    count: totalUsersCount,
    color: "border-red-400 text-red-500",
    icon: <User />,
    path: "/users",
  },
  {
    title: "Active Users",
    count: activeUsersCount,
    color: "border-green-400 text-green-500",
    icon: <Users />,
    path: "/users?status=active",
  },
  {
    title: "Inactive Users",
    count: inactiveUsersCount,
    color: "border-red-400 text-red-500",
    icon: <Users />,
    path: "/users?status=inactive",
  },
  {
    title: "Admin & Staff",
    count: facultyCount,
    color: "border-blue-300 text-blue-500",
    icon: <Users />,
    path: "/faculty/all",
  },
  {
    title: "Active Staff",
    count: activeStaffCount,
    color: "border-green-400 text-green-500",
    icon: <Users />,
    path: "/faculty/all?status=active",
  },
  {
    title: "Inactive Staff",
    count: inactiveStaffCount,
    color: "border-red-400 text-red-500",
    icon: <Users />,
    path: "/faculty/all?status=inactive",
  },
  {
    title: "Total courses",
    count: totalCoursesCount,
    color: "border-yellow-300 text-yellow-500",
    icon: <Home />,
    path: "/courses/show",
  },

  // {
  //   title: "Total lectures",
  //   count: totalLectures,
  //   color: "border-purple-300 text-purple-500",
  //   icon: <User />,
  //   path: "/lectures",
  // },
  {
    title: "Total Feedback",
    count: totalFeedbackCount,
    color: "border-indigo-300 text-indigo-500",
    icon: <ShieldCheck />,
    path: "/feedback",
  },
  {
    title: "Total News",
    count: totalNewsCount,
    color: "border-pink-300 text-pink-500",
    icon: <Newspaper />,
    path: "/news-management",
  },
];

const facultyMenuItems = [
  { label: "All Admin&Staff", path: "/faculty/all" },
  { label: "Add Admin&Staff", path: "/faculty/add" },
];

const courseMenuItems = [
  { label: "All Courses", path: "/courses/show" }
];

const additionalMenuItems = [
  {label: "Pages", path: "/pages", icon: <BookCopy size={18} /> },
  { label: "Users", path: "/users", icon: <MessageCircle size={18} /> },
  { label: "Tutors", path: "/tutors", icon: <MessageCircle size={18} /> },
  { label: "Countries", path: "/countries", icon: <Laptop size={18} /> },
  { label: "States", path: "/states", icon: <MapPin size={18} /> },
  { label: "Cities", path: "/cities", icon: <MapPin size={18} /> },
  { label: "Subjects", path: "/subject-list", icon: <BookOpen size={18} /> },
  { label: "Languages", path: "/languages", icon: <BookOpen size={18} /> },
  { label: "Educational Levels", path: "/educational-levels", icon: <BookOpen size={18} /> },
  { label: "Goal Manager", path: "/goals", icon: <ListStart size={18} /> },
  { label: "Topic Manager", path: "/topics", icon: <SquareKanban size={18} /> },
  { label: "Admin & Staff", path: "/faculty", icon: <Users size={18} />, hasDropdown: true },
   {label: "Menu Permission", path: "/menu-permission", icon: <Users size={18} />},
 
  // { label: "Coupons", path: "/coupons", icon: <BadgePercent size={18} /> },


  // { label: "Audit Logs", path: "/audit-logs", icon: <ShieldCheck size={18} /> },
  // { label: "Payments", path: "/payments", icon: <BadgeIndianRupee size={18} /> },

  // { label: "FAQ Management", path: "/faqs", icon: <HelpCircle size={18} /> },
  // { label: "Contact Us", path: "/contact-us", icon: <PhoneCall size={18} /> },
  // { label: "Feedback Management", path: "/feedback", icon: <ShieldCheck size={18} /> },
  // { label: "News Management", path: "/news-management", icon: <Newspaper size={18} /> },
  { label: "Notification Manager", path: "/notification-manager", icon: <QrCode size={18} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={18} /> },
];

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [facultyList, setFacultyList] = useState([]);
  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const [inactiveStaffCount, setInactiveStaffCount] = useState(0);

  const [courseList, setCourseList] = useState(() => {
    const stored = localStorage.getItem("courseList");
    return stored ? JSON.parse(stored) : [];
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);
  const [totalNewsCount, setTotalNewsCount] = useState(0);
  const [activeMenuItem, setActiveMenuItem] = useState('/');

  
  const getAuthToken = () => {
    return localStorage.getItem("token") || "";
  };

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const token = getAuthToken();
        


       
        const activeStaffRes = await axios.get(`${API_BASE_URL}/account/stafflist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 100,
            offset: 0,
            status: "ACTIVE",
          },
        });
        
        
        const inactiveStaffRes = await axios.get(`${API_BASE_URL}/account/stafflist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 100,
            offset: 0,
            status: "DEACTIVE",
          },
        });

        if (activeStaffRes.status === 200 && activeStaffRes.data && inactiveStaffRes.status === 200 && inactiveStaffRes.data) {
          const activeStaffData = activeStaffRes.data.result || [];
          const inactiveStaffData = inactiveStaffRes.data.result || [];
          const allStaff = [...activeStaffData, ...inactiveStaffData];
          
          setFacultyList(allStaff);
          setActiveStaffCount(activeStaffData.length);
          setInactiveStaffCount(inactiveStaffData.length);
        }

        
        const activeUsersRes = await axios.get(`${API_BASE_URL}/account/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status: "ACTIVE",
          },
        });
      
        const inactiveUsersRes = await axios.get(`${API_BASE_URL}/account/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status: "DEACTIVE",
          },
        });

        if (activeUsersRes.status === 200 && activeUsersRes.data && inactiveUsersRes.status === 200 && inactiveUsersRes.data) {
          setActiveUsersCount(activeUsersRes.data.total || 0);
          setInactiveUsersCount(inactiveUsersRes.data.total || 0);
          setTotalUsersCount((activeUsersRes.data.total || 0) + (inactiveUsersRes.data.total || 0));
        }

      
        const coursesRes = await axios.get(`${API_BASE_URL}/course/admin`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10,
            offset: 0,
          },
        });
        if (coursesRes.status === 200 && coursesRes.data) {
          setTotalCoursesCount(coursesRes.data.total || 0);
        }

       
        const feedbackRes = await axios.get(`${API_BASE_URL}/rating-feedback/list`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status:true
          },
        });
        if (feedbackRes.status === 200 && feedbackRes.data) {
          setTotalFeedbackCount(feedbackRes.data.total || 0);
        }

        
        const newsRes = await axios.get(`${API_BASE_URL}/news/list`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10,
            offset: 0,
            
          },
        });
        if (newsRes.status === 200 && newsRes.data) {
          setTotalNewsCount(newsRes.data.total || 0);
        }

      } catch (error) {
        console.error("Error fetching stats:", error.message);
        if (error.response && error.response.status === 401) {
          dispatch(logoutUser());
          navigate("/login");
        }
      }
    };

    fetchAllStats();
  }, [dispatch, navigate]);

  useEffect(() => {
    localStorage.setItem("courseList", JSON.stringify(courseList));
  }, [courseList]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    dispatch(logoutUser());
    setShowLogoutConfirm(false);
    toast.success('Logged out successfully! See you next time.');
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return additionalMenuItems;
    return additionalMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="flex h-screen font-sans text-gray-800">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Confirm Logout</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to logout from the admin panel?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-sm font-medium text-white rounded-md hover:bg-red-700 focus:outline-none"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
     <aside className="w-68 bg-[#C4DAD2] border-r shadow-md flex flex-col">
        <LazyImage src={WiznovyLogo} alt="Wiznovy Logo" className="w-26 h-26 mx-auto mt-4 mb-10 rounded-full object-cover"/>
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <nav className="space-y-3 pb-6">
            <SidebarItem 
              icon={<Home size={18} />} 
              label="Home" 
              onClick={() => { setActiveMenuItem('/'); navigate('/'); }} 
              isActive={activeMenuItem === '/'}
            />
            
            <SidebarItem 
              icon={<PcCase size={18} />} 
              label="Courses" 
              onClick={() => { setActiveMenuItem('/courses/show'); navigate('/courses/show'); }} 
              isActive={activeMenuItem === '/courses/show'}
            />
            
            {filteredMenuItems.map((item) => (
              <SidebarItem 
                key={item.path} 
                icon={item.icon} 
                label={item.label} 
                onClick={item.hasDropdown ? undefined : () => { setActiveMenuItem(item.path); navigate(item.path); }}
                hasDropdown={item.hasDropdown}
                isActive={activeMenuItem === item.path}
              >
                {item.hasDropdown && (
                  <>
                    <DropdownItem label="All Admin & Staff" onClick={() => { setActiveMenuItem('/faculty/all'); navigate('/faculty/all'); }} />
                    <DropdownItem label="Add Admin & Staff" onClick={() => { setActiveMenuItem('/faculty/add'); navigate('/faculty/add'); }} />
                  </>
                )}
              </SidebarItem>
            ))}
            
            {filteredMenuItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No menu items found matching your search.
              </div>
            )}
            
            {/* <SidebarItem icon={<HelpCircle size={18} />} label="Support" /> */}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="px-5 py-4 border-t border-gray-200 text-sm text-gray-600 bg-[#C4DAD2]">
          <div className="flex flex-col gap-2">
            
            <p className="font-semibold text-l text-black">{localStorage.getItem('email') || user?.email || 'admin@wiznovy.com'}</p>
            <p className="font-semibold text-l text-black">{localStorage.getItem('role') || user?.role || 'admin@wiznovy.com'}</p>
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-2 text-sm text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<OverviewSection 
            facultyCount={facultyList.length} 
            activeStaffCount={activeStaffCount}
            inactiveStaffCount={inactiveStaffCount}
            totalUsersCount={totalUsersCount}
            activeUsersCount={activeUsersCount}
            inactiveUsersCount={inactiveUsersCount}
            totalCoursesCount={totalCoursesCount}
            totalFeedbackCount={totalFeedbackCount}
            totalNewsCount={totalNewsCount}
            setActiveMenuItem={setActiveMenuItem}
          />} />
          <Route path="/pages" element={<PageManager />} />
          {/* <Route path="/classes" element={<ClassesPage />} /> */}
          {/* <Route path="/boards" element={<AdminBoardManagement />} /> */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/tutors" element={<Tutormanagement />} />
          <Route path="/countries" element={<CountryManagement />} />
          <Route path="/states" element={<StateManagement />} />
          <Route path="/cities" element={<CityManager />} />
          <Route path="/subject-list" element={<SubjectsNew />} />
          <Route path="/languages" element={<LanguageManager />} />
          <Route path="/educational-levels" element={<EducationalLevelManager />} />
          <Route path="/goals" element={<GoalManager />} />
          <Route path="/topics" element={<TopicManager />} />
          <Route path="/faculty/all" element={<AllFaculty facultyList={facultyList} setFacultyList={setFacultyList} />} />
          <Route path="/faculty/add" element={<FacultyArea facultyList={facultyList} setFacultyList={setFacultyList} />} />
          <Route path="/menu-permission/:accountId" element={<Menu_permission />} />
          <Route path="/courses/show" element={<CourseManager courseList={courseList} setCourseList={setCourseList} />} />
          <Route path="/courses/:courseId/details" element={<CourseDetails />} />
          <Route path="/courses/add" element={<PlaceholderPage page="Add Course" />} />
          {/* <Route path="/audio-lectures" element={<AudioLectureManager />} /> */}
          {/* <Route path="/study-material" element={<Study_material />} /> */}
      
          <Route path="/subject" element={<SubjectsNew />} />
          <Route path="/faqs" element={<FaqManager />} />
          <Route path="/contact-us" element={<ContactUsAdmin />} />
          <Route path="/feedback" element={<AdminFeedback />} />

          <Route path="/notification-manager" element={
            
              <NotificationManager />
          } />
          <Route path="/coupons" element={
            
              <CouponManager />
           
          } />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<PlaceholderPage page="404 - Not Found" />} />
        </Routes>
      </main>
    </div>
  );
}

function OverviewSection({ facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount, setActiveMenuItem }) {
  const navigate = useNavigate();
  
  const handleKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveMenuItem(item.path);
      navigate(item.path);
    }
  };
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getStats(facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount).map((item, index) => (
          <div
            key={index}
            onClick={() => {
              setActiveMenuItem(item.path);
              navigate(item.path);
            }}
            onKeyDown={(e) => handleKeyDown(e, item)}
            role="button"
            tabIndex={0}
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className={`p-3 mr-3 rounded-lg border ${item.color}`}>
              {item.icon}
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="text-xl font-bold text-gray-800">{item.count}</p>
            </div>
            
            <div className="text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

OverviewSection.propTypes = {
  facultyCount: PropTypes.number.isRequired,
  activeStaffCount: PropTypes.number.isRequired,
  inactiveStaffCount: PropTypes.number.isRequired,
  totalUsersCount: PropTypes.number.isRequired,
  activeUsersCount: PropTypes.number.isRequired,
  inactiveUsersCount: PropTypes.number.isRequired,
  totalCoursesCount: PropTypes.number.isRequired,
  totalFeedbackCount: PropTypes.number.isRequired,
  totalNewsCount: PropTypes.number.isRequired,
  setActiveMenuItem: PropTypes.func.isRequired,
};

function SidebarItem({ icon, label, onClick, hasDropdown = false, children, isActive = false }) {
  const [open, setOpen] = useState(false);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasDropdown) setOpen(!open);
      if (onClick && !hasDropdown) onClick();
    }
  };
  
  return (
    <div>
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
          isActive 
            ? 'bg-[#16423C] text-white' 
            : 'hover:bg-blue-100 text-gray-800'
        }`}
        onClick={() => {
          if (hasDropdown) setOpen(!open);
          if (onClick && !hasDropdown) onClick();
        }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          {icon && <span>{icon}</span>}
          <span className="font-medium">{label}</span>
        </div>
        {hasDropdown && (
          <span className={isActive ? "text-white" : "text-gray-500"}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </div>
      {hasDropdown && open && (
        <div className="ml-4 mt-1 space-y-1 text-sm border-l border-gray-200 pl-3">{children}</div>
      )}
    </div>
  );
}

SidebarItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  hasDropdown: PropTypes.bool,
  children: PropTypes.node,
  isActive: PropTypes.bool,
};

function DropdownItem({ label, onClick }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  
  return (
    <div
      className="px-2 py-1 rounded-md hover:bg-gray-200 cursor-pointer text-gray-700 transition"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {label}
    </div>
  );
}

DropdownItem.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

function PlaceholderPage({ page }) {
  return (
    <div className="text-center text-gray-500 text-lg mt-10">
      <p>{page} Page Under Construction...</p>
    </div>
  );
}

PlaceholderPage.propTypes = {
  page: PropTypes.string.isRequired,
};