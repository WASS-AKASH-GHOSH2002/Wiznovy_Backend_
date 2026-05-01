export interface TwentyFourHourReminderPayload {
  email: string;
  firstName: string;
  role: 'student' | 'tutor';
  studentName: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  timezone: string;
  dashboardLink: string;
}

export interface ExpiryWarningPayload {
  email: string;
  itemName: string;
  daysLeft: number;
}

export interface ExpiredPayload {
  email: string;
  itemName: string;
}

export interface ZoomLinkReminderPayload {
  email: string;
  firstName: string;
  subject: string;
  date: string;
  time: string;
  timezone: string;
  zoomLink: string;
  meetingId: string;
  passcode: string;
}

export interface TenMinReminderPayload {
  email: string;
  firstName: string;
  role: 'student' | 'tutor';
  tutorName: string;
  subject: string;
  zoomLink: string;
}
