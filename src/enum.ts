export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TUTOR='TUTOR',
  STAFF = 'STAFF',
  //SUB_ADMIN = 'SUB_ADMIN',

}

export enum DefaultStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVE = 'DEACTIVE',
  DELETED = 'DELETED',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum AIType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum FeedbackStatus {
  YES = 'YES',
  NO = 'NO',
  DELETED = 'DELETED',
}

export enum QnAStatus {
  YES = 'YES',
  NO = 'NO',
  DELETED = 'DELETED',
}

export enum ContactUsStatus {
  PENDING = 'PENDING',
  REPLIED = 'REPLIED',
}

export enum PermissionAction {
  CREATE = 'Create',
  READ = 'Read',
  UPDATE = 'Update',
  DELETE = 'Delete',
}

export enum LogType {
  LOGIN = 'IN',
  LOGOUT = 'OUT',
}



export enum PageType {
  USER = 'USER',
  TUTOR = 'TUTOR',
}

export enum NotificationType {
 
  NEW_PRODUCT = 'NEW PRODUCT',
  NEW_ACCOUNT = 'NEW ACCOUNT',
  CONTACT_US = 'CONTACT US',
  QNA = 'QNA',
  FEEDBACK = 'FEEDBACK',
  INVOICE = 'INVOICE',
  STAFF = 'STAFF',
  TICKET = 'TICKET',


  USER_PRODUCT = 'USER PRODUCT',
  USER_ACCOUNT = 'USER ACCOUNT',
  USER_INVOICE = 'USER INVOICE',
  USER_PAYMENT = 'USER PAYMENT',
  USER_TICKET = 'USER TICKET',
  OFFER = 'OFFER',


  SESSION_BOOKED = 'SESSION_BOOKED',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  SESSION_RESCHEDULED = 'SESSION_RESCHEDULED',
  SESSION_REMINDER = 'SESSION_REMINDER',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  

  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',

  PAYOUT_SUBMITTED = 'PAYOUT_SUBMITTED',
  PAYOUT_APPROVED = 'PAYOUT_APPROVED',
  PAYOUT_REJECTED = 'PAYOUT_REJECTED',

  // FOR ALL
  LOGIN = 'LOGIN',

  DEMO = 'DEMO'
}

export enum YNStatus {
  All = 'All',
  YES = 'Yes',
  NO = 'No',
}

export enum Feature {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
}
export enum RatingShortStatus {
  ASC = 'ASC',
  DESC = 'DESC',
  ALL = 'ALL',
}

export enum LoginType {
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  GUEST = 'GUEST',
}

export enum ADType {
  ASC = 'ASC',
  DESC = 'DESC',
  NONE = '',
}

export enum ProductFileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}
export enum AccessTypes {
  PAID = 'PAID',
  FREE = 'FREE',
}

export enum PurchaseType {
  COURSE = 'COURSE',
  SESSION = 'SESSION',
}
export enum RatingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export enum ContentType {
  COURSE = 'COURSE',
  UNIT = 'UNIT',
  AUDIO_LECTURE = 'AUDIO_LECTURE',
  STUDY_MATERIAL = 'STUDY_MATERIAL',
  MCQ_TEST = 'MCQ_TEST',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}
export enum Level {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  EXPERTS = 'Exparts',
  PRO_MASTER='Pro_Master'
}
export enum BannerType {
  TUTOR_APP = 'TUTOR_APP',
  USER_APP= 'USER_APP',
 USER_WEBSITE = 'USER_WEBSITE',
  TUTOR_WEBSITE = 'TUTOR_WEBSITE',
 
}

export enum DateType {
  PAST = 'past',
  TODAY = 'today',
  UPCOMING = 'upcoming',
}

export enum PaymentMethod {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  UPI = 'UPI',
}


export enum Qualification {
  HIGH_SCHOOL = 'High School',
  DIPLOMA = 'Diploma',
  BACHELORS = 'Bachelors',
  MASTERS = 'Masters',
  DOCTORATE = 'Doctorate',
  OTHER = 'Other',
}

export enum ScheduleStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export enum BookStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export enum SessionDuration {
  FIFTEEN_MIN = 15,
  THIRTY_MIN = 30,
  FORTY_FIVE_MIN = 45,
  SIXTY_MIN = 60,
}

export enum SessionStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum TimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export enum SessionDurationType {
  SHORT = 25,
  LONG = 45,
}

export enum SessionType {
  TRIAL = 'TRIAL',
  REGULAR = 'REGULAR',
}
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum CourseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}


export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',

}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE'
}

export enum FileSizeLimit {
  IMAGE_SIZE = 5242880, 
  VIDEO_SIZE = 52428800,
  DOCUMENT_SIZE = 10485760, 
  LOGO_SIZE = 1048576, 
}

export enum AdminActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUSPEND = 'SUSPEND',
  ACTIVATE = 'ACTIVATE',
  COURSE_APPROVED = 'COURSE_APPROVED',
  COURSE_REJECTED = 'COURSE_REJECTED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  USER_UPDATED = 'USER_UPDATED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  TUTOR_UPDATED = 'TUTOR_UPDATED',
  TUTOR_STATUS_CHANGED = 'TUTOR_STATUS_CHANGED',
  STAFF_CREATED = 'STAFF_CREATED',
  STAFF_UPDATED = 'STAFF_UPDATED',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
}

export enum AdminActionTargetType {
  COURSE = 'COURSE',
  PAYOUT = 'PAYOUT',
  USER = 'USER',
  TUTOR = 'TUTOR',
  STAFF = 'STAFF',
  SESSION = 'SESSION',
}

export enum FaqType {
  USER = 'USER',
  TUTOR = 'TUTOR',
}