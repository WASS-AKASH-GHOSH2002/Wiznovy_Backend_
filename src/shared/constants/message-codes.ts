export const MESSAGE_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Invalid credentials provided',
  },
  AUTH_ACCOUNT_INACTIVE: {
    code: 'AUTH_002',
    message: 'Account is not active',
  },
  AUTH_SYSTEM_INACTIVE: {
    code: 'AUTH_003',
    message: 'System is not active',
  },
  AUTH_INVALID_DOMAIN: {
    code: 'AUTH_004',
    message: 'Invalid domain for user role',
  },
  AUTH_LOGIN_SUCCESS: {
    code: 'AUTH_005',
    message: 'Login successful',
  },
  AUTH_LOGOUT_SUCCESS: {
    code: 'AUTH_006',
    message: 'Logout successful',
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_007',
    message: 'Invalid token format',
  },
  AUTH_TOKEN_REQUIRED: {
    code: 'AUTH_008',
    message: 'Token required',
  },


  AUTH_INVALID_EMAIL_FORMAT: {
    code: 'AUTH_009',
    message: 'Please enter a valid email address',
  },
  AUTH_EMAIL_REQUIRED: {
    code: 'AUTH_010',
    message: 'Please enter your email address',
  },
  AUTH_PASSWORD_REQUIRED: {
    code: 'AUTH_011',
    message: 'Please enter your password',
  },
  AUTH_PASSWORD_TOO_SHORT: {
    code: 'AUTH_012',
    message: 'Password must be at least 8 characters long',
  },
  AUTH_PASSWORD_WEAK: {
    code: 'AUTH_013',
    message:
      'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
  AUTH_PASSWORDS_DO_NOT_MATCH: {
    code: 'AUTH_014',
    message:
      'The passwords you entered do not match. Please try again',
  },


  AUTH_LOGIN_FAILED: {
    code: 'AUTH_015',
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect. Please try again',
  },
  AUTH_ACCOUNT_LOCKED: {
    code: 'AUTH_016',
    title: 'Account Locked',
    message: 'Please try again in 30 minutes or reset your password',
  },
  AUTH_EMAIL_ALREADY_REGISTERED: {
    code: 'AUTH_017',
    title: 'Create Your Account',
    message: 'An account with this email already exists. Please log in or use a different email',
  },
  AUTH_PHONE_ALREADY_REGISTERED: {
    code: 'AUTH_024',
    title: 'Phone Already Registered',
    message: 'This phone number is already associated with an account. Please log in or use a different number',
  },

  AUTH_EMAIL_NOT_VERIFIED: {
    code: 'AUTH_018',
    message:
      'Please verify your email address before logging in. Check your inbox for the verification link',
  },
  AUTH_ACCOUNT_DEACTIVATED: {
    code: 'AUTH_019',
    message:
      'Your account is scheduled for deletion. Would you like to reactivate it',
  },
  AUTH_ACCOUNT_NOT_FOUND: {
    code: 'AUTH_020',
    title: 'Account Not Found',
    message: 'Please check and try again or create a new account',
  },
  AUTH_SOCIAL_LOGIN_FAILED: {
    code: 'AUTH_021',
    title: 'Login Failed',
    message: 'Please try again or use email and password',
  },
  AUTH_OTP_EXPIRED: {
    code: 'AUTH_022',
    title: 'Verify Your Identity',
    message: 'Invalid or expired OTP. Please try again or request a new code',
  },
  AUTH_OTP_EXPIRED_ONLY: {
    code: 'AUTH_025',
    title: 'OTP Expired',
    message: 'Please request a new one',
  },

  AUTH_OTP_SEND_FAILED: {
    code: 'AUTH_023',
    title: 'OTP Send Failed',
    message: "We couldn't send your verification code. Please try again. If the issue persists, contact support@wiznovy.com",
  },

  // Session
  SESSION_SLOT_LOCKED: {
    code: 'SESSION_001',
    message: 'This time slot is currently being booked by another user',
  },
  SESSION_TUTOR_NOT_FOUND: {
    code: 'SESSION_002',
    message: 'Tutor not found',
  },
  SESSION_TRIAL_ALREADY_BOOKED: {
    code: 'SESSION_003',
    title: 'Trial Already Used',
    message: 'Book a regular session instead. One trial per student-tutor pair',
  },
  SESSION_SLOT_CONFLICT: {
    code: 'SESSION_004',
    message: 'Time slot conflicts with existing booking',
  },
  SESSION_NOT_FOUND: {
    code: 'SESSION_005',
    message: 'Session not found',
  },
  SESSION_CANCEL_FORBIDDEN: {
    code: 'SESSION_006',
    message: 'You can only cancel your own sessions',
  },
  SESSION_CANCEL_INVALID_STATUS: {
    code: 'SESSION_007',
    message: 'Only scheduled sessions can be cancelled',
  },
  SESSION_CANCEL_TOO_LATE: {
    code: 'SESSION_008',
    message: 'Sessions cannot be cancelled less than 2 hours before start time',
  },
  SESSION_RESCHEDULE_FORBIDDEN: {
    code: 'SESSION_009',
    message: 'You can only reschedule your own sessions',
  },
  SESSION_RESCHEDULE_INVALID_STATUS: {
    code: 'SESSION_010',
    message: 'Only scheduled sessions can be rescheduled',
  },
  SESSION_RESCHEDULE_TOO_LATE: {
    code: 'SESSION_011',
    title: 'Too Late to Reschedule',
    message: 'Reschedule window has passed',
  },
  SESSION_SLOT_NOT_AVAILABLE: {
    code: 'SESSION_012',
    message: 'Selected time slot is not available in tutor\'s schedule',
  },
  SESSION_LOCK_EXPIRED: {
    code: 'SESSION_013',
    message: 'Session lock has expired. Please try booking again.',
  },
  SESSION_INVALID_STATUS: {
    code: 'SESSION_014',
    message: 'Session is not in pending status',
  },
  SESSION_VIEW_FORBIDDEN: {
    code: 'SESSION_015',
    message: 'You can only view your own sessions',
  },
  SESSION_USER_NOT_FOUND: {
    code: 'SESSION_016',
    message: 'User not found',
  },
  SESSION_INSUFFICIENT_WALLET_BALANCE: {
    code: 'SESSION_017',
    title: 'Insufficient Balance',
    message: 'Please add funds or use a different payment method',
  },
  SESSION_RESCHEDULE_LIMIT_REACHED: {
    code: 'SESSION_018',
    title: 'Reschedule Limit Reached',
    message: 'You can cancel the session instead',
  },
  SESSION_RESCHEDULE_TOO_CLOSE: {
    code: 'SESSION_019',
    message: 'Rescheduling is not allowed less than 1 hour before the session.',
  },
  SESSION_CANCEL_FULL_REFUND_CONFIRM: {
    code: 'SESSION_020',
    title: 'Cancel Session?',
    message: 'A 100% refund of {amount} will be credited to your wallet. Do you want to proceed?',
  },
  PAYMENT_FAILED: {
    code: 'PAYMENT_001',
    title: 'Payment Error',
    message: 'Please try again. If issue persists, contact support@wiznovy.com',
  },
  PAYMENT_SERVICE_UNAVAILABLE: {
    code: 'PAYMENT_002',
    title: 'Service Unavailable',
    message: 'Please try again in a few minutes',
  },
  PAYMENT_DUPLICATE: {
    code: 'PAYMENT_003',
    title: 'Duplicate Payment',
    message: 'Please check your payment history',
  },
  PAYOUT_INSUFFICIENT_BALANCE: {
    code: 'PAYOUT_001',
    title: 'Insufficient Balance',
    message: 'You cannot withdraw more than your available balance',
  },
  PAYOUT_BANK_DETAILS_REQUIRED: {
    code: 'PAYOUT_002',
    title: 'Bank Details Required',
    message: 'Please add your bank account details to request a payout',
  },
  PAYOUT_REQUEST_PENDING: {
    code: 'PAYOUT_003',
    title: 'Request Pending',
    message: 'Please wait until your current request is completed before submitting a new one',
  },
  VALIDATION_FIELD_REQUIRED: {
    code: 'VALIDATION_001',
    title: 'Field Required',
    message: '{fieldName} is required. Please fill in this field',
  },
  VALIDATION_FILE_TOO_LARGE: {
    code: 'VALIDATION_002',
    title: 'File Too Large',
    message: 'Please upload a smaller image',
  },
  VALIDATION_INVALID_FILE_TYPE: {
    code: 'VALIDATION_003',
    title: 'Invalid File Type',
    message: 'Please upload an image in JPG, PNG, or WEBP format',
  },
  VALIDATION_INVALID_DOCUMENT_TYPE: {
    code: 'VALIDATION_004',
    title: 'Invalid Document Type',
    message: 'Please upload your ID in JPG, PNG, or PDF format',
  },
};