
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import courseReducer from './Courseslice';
import userReducer from './userSlice';
import tutorReducer from './tutorSlice';
import countryReducer from './countrySlice';
import subjectManagementReducer from './subjectSlice';
import courseDetailsReducer from './courseDetailsSlice';
import stateReducer from './stateSlice';
import topicReducer from './topicSlice';
import goalReducer from './goalSlice';
import unitReducer from './unitSlice';
import videoLectureReducer from './videoLectureSlice';
import studyMaterialReducer from './studyMaterialSlice';
import languageReducer from './languageSlice';
import pageReducer from './pageSlice';
import qualificationReducer from './qualificationSlice';
import cityReducer from './citySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    users: userReducer,
    tutors: tutorReducer,
    countries: countryReducer,
    subjectsManagement: subjectManagementReducer,
    courseDetails: courseDetailsReducer,
    states: stateReducer,
    topics: topicReducer,
    goals: goalReducer,
    units: unitReducer,
    videoLecture: videoLectureReducer,
    studyMaterial: studyMaterialReducer,
    languages: languageReducer,
    pages: pageReducer,
    qualifications: qualificationReducer,
    cities: cityReducer,
  }
});