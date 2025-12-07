import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, NotAcceptableException } from '@nestjs/common';

@Injectable()
export class NodeMailerService {
  constructor(private readonly mailService: MailerService) { }

  sendEmail(name, email) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Wrong Document!',
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upload Correct Document</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h2 {
      color: #444;
    }
    p {
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007BFF;
      color: #fff;
      text-decoration: none;
      border-radius: 5px;
    }
    .btn:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Action Required: Upload Correct Document</h2>
    <p>Dear <b>${name}</b>,</p>
    <p>We have reviewed the document you recently submitted, and it appears that the file uploaded does not meet the required criteria. Please upload the correct document at your earliest convenience.</p>
    <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
    <p>Thank you for your prompt attention to this matter.</p>
    <p>Best regards,</p>
    <p>Admin<br>Wiznovy </p>
  </div>
</body>
</html>
`,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendOtpInEmail(email, otp) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Email Verification OTP',
        html: `
        <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OTP Email Template</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
      crossorigin="anonymous"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
    />

    <link rel="stylesheet" href="/style.css" />
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 0;
        margin: 0;
      }
      .container-sec {
        background-color: #ffffff;
        border-radius: 8px;
        padding: 20px;
        margin-top: 30px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        max-width: 600px;
      }
      .otp-code {
        font-size: 24px;
        font-weight: bold;
        background-color: #f8f9fa;
        padding: 15px;
        text-align: center;
        border-radius: 8px;
        border: 1px dashed #007bff;
        color: #007bff;
      }
      .btn-verify {
        display: inline-block;
        padding: 10px 20px;
        color: #ffffff;
        background-color: #007bff;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
      }
      .footer-text {
        color: #6c757d;
        font-size: 14px;
        text-align: center;
        margin-top: 20px;
      }
      .footer-text a {
        color: #007bff;
        text-decoration: none;
      }
      .otp-lock {
        color: #333;
        font-size: 80px;
      }
      .welcome-section {
        background: #144fa9db;
        padding: 30px;
        border-radius: 4px;
        color: #fff;
        font-size: 20px;
        margin: 20px 0px;
      }
      .welcome-text {
        font-family: monospace;
      }
      .app-name {
        font-size: 30px;
        font-weight: 800;
        margin: 7px 0px;
      }
      .verify-text {
        margin-top: 25px;
        font-size: 25px;
        letter-spacing: 3px;
      }
      i.fas.fa-envelope-open {
        font-size: 35px !important;
        color: #ffffff;
      }
    </style>
  </head>

  <body>
    <div class="container-sec">
      <div class="text-center">
        <div class="welcome-section">
          <div class="verify-text">Please Verify Your Email Address</div>
          <div class="email-icon">
            <i class="fas fa-envelope-open"></i>
          </div>
        </div>
        <h2>Dear Customer</h2>
        <p>Your One-Time Password (OTP) for verification is:</p>
        <div class="otp-code">${otp}</div>
        <p class="mt-4">
          Please use this OTP to complete your verification. The OTP is valid
          for the next 10 minutes.
        </p>
      </div>
      <div class="footer-text">
        <p>Thank you,<br />Wiznovy Team</p>
      </div>
    </div>

    <!-- <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"
    ></script> -->
  </body>
</html>

        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  welcomeMail(email: string, name: string, joinDate: string) {
    try {
      return this.mailService.sendMail({
        to: email,
        from: 'wiznovy@gmail.com',
        subject: 'Welcome to Wiznovy',
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Wiznovy</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 25px;
      margin: auto;
      max-width: 600px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h2 {
      color: #144fa9;
      font-size: 22px;
      margin-bottom: 15px;
    }
    p {
      font-size: 15px;
      color: #333;
      line-height: 1.6;
    }
    .footer {
      margin-top: 20px;
      font-size: 13px;
      color: #777;
      text-align: center;
    }
    .footer a {
      color: #144fa9;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Wiznovy</h2>
    <p>Dear ${name},</p>
    <p>We are pleased to inform you that your account with <b>Wiznovy</b> has been successfully created on <b>${joinDate}</b>.</p>
    <p>You may now log in to your dashboard and access your account at any time.</p>
    <p>Thank you for registering with us.</p>
    <p>Best regards,<br><b>The Wiznovy Team</b></p>
    <div class="footer">
      <p>Wiznovy Inc.<br>
      wiznovy@gmail.com | +91-1234567890</p>
      <a href="#">Unsubscribe</a>
    </div>
  </div>
</body>
</html>
      `,
      });
    } catch (error) {
      throw new NotAcceptableException('Error in sending email');
    }
  }

  tutorRegistrationMail(email: string, name: string, joinDate: string) {
  try {
    return this.mailService.sendMail({
      to: email,
      from: 'wiznovy@gmail.com',
      subject: 'Welcome to Wiznovy Tutor Platform – Profile Under Review',
      html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tutor Registration – Wiznovy</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 25px;
      margin: auto;
      max-width: 600px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h2 {
      color: #144fa9;
      font-size: 22px;
      margin-bottom: 15px;
    }
    p {
      font-size: 15px;
      color: #333;
      line-height: 1.6;
    }
    .highlight {
      color: #144fa9;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      font-size: 13px;
      color: #777;
      text-align: center;
    }
    .footer a {
      color: #144fa9;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Wiznovy Tutor Platform</h2>
    <p>Dear ${name},</p>
    <p>Thank you for registering as a <b>Tutor</b> on <b>Wiznovy</b> on <b>${joinDate}</b>.</p>
    <p>Your profile is currently <span class="highlight">under review</span> by our verification team. 
    This process ensures that our students are matched with verified and high-quality tutors.</p>
    <p>Once your profile is approved, you will receive an email notification, 
    and you can start connecting with students right away!</p>
    <p>We appreciate your patience and look forward to having you on board.</p>
    <p>Best regards,<br><b>The Wiznovy Team</b></p>
    <div class="footer">
      <p>Wiznovy Inc.<br>
      wiznovy@gmail.com | +91-1234567890</p>
      <a href="#">Unsubscribe</a>
    </div>
  </div>
</body>
</html>
      `,
    });
  } catch (error) {
    throw new NotAcceptableException('Error in sending tutor registration email');
  }
}



  purchaseSuccessEmail(email, itemName, amount) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Purchase Successful - Wiznovy Team',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #28a745; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Purchase Successful!</div>
            </div>
            <h2 style="text-align: center;">Thank you for your purchase</h2>
            <p style="text-align: center;"><strong>Item:</strong> ${itemName}</p>
            <p style="text-align: center;"><strong>Amount:</strong> ₹${amount}</p>
            <p style="text-align: center;">You can now access your purchased content. Happy learning!</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br /> Wiznovy  Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  expiryWarningEmail(email, itemName, daysLeft) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Content Expiring Soon - r',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #ffc107; padding: 30px; border-radius: 4px; color: #000; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Content Expiring Soon!</div>
            </div>
            <h2 style="text-align: center;">Your access is expiring in ${daysLeft} days</h2>
            <p style="text-align: center;"><strong>Content:</strong> ${itemName}</p>
            <p style="text-align: center;">Don't miss out! Renew your access to continue learning.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy  Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  expiredEmail(email, itemName) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Content Expired - Wiznovy',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #dc3545; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Content Expired</div>
            </div>
            <h2 style="text-align: center;">Your access has expired</h2>
            <p style="text-align: center;"><strong>Content:</strong> ${itemName}</p>
            <p style="text-align: center;">Purchase again to continue your learning journey!</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy  Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendAccountLockNotification(email: string, unlockTime: Date) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Account Locked - Wiznovy',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #dc3545; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Account Locked</div>
            </div>
            <h2 style="text-align: center;">Security Alert</h2>
            <p style="text-align: center;">Your account has been temporarily locked due to multiple failed login attempts.</p>
            <p style="text-align: center;"><strong>Unlock Time:</strong> ${unlockTime.toLocaleString()}</p>
            <p style="text-align: center;">If this wasn't you, please contact our support team immediately.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Security Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendAccountStatusEmail(email: string, role: string, status: string, message: string) {
    try {
      const statusColors = {
        'ACTIVE': '#28a745',
        'DEACTIVE': '#ffc107',
        'SUSPENDED': '#dc3545',
        'PENDING': '#17a2b8',
        'DELETED': '#6c757d'
      };

      return this.mailService.sendMail({
        to: email,
        subject: `Account Status Update - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: ${statusColors[status] || '#17a2b8'}; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">${role} Account Status Update</div>
            </div>
            <h2 style="text-align: center;">Status: ${status}</h2>
            <p style="text-align: center;">${message}</p>
            <p style="text-align: center;">If you have any questions, please contact our support team.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendSessionReminder(email: string, studentName: string, tutorName: string, sessionDate: string, startTime: string, endTime: string, hoursUntil: number) {
    try {
      const reminderType = hoursUntil === 24 ? '24 Hour' : '1 Hour';
      const urgencyColor = hoursUntil === 1 ? '#dc3545' : '#ffc107';
      
      return this.mailService.sendMail({
        to: email,
        subject: `Session Reminder - ${reminderType} Notice`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: ${urgencyColor}; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">${reminderType} Session Reminder</div>
            </div>
            <h2 style="text-align: center;">Upcoming Session</h2>
            <p style="text-align: center;">Dear ${studentName},</p>
            <p style="text-align: center;">This is a reminder that you have a session scheduled in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
            </div>
            <p style="text-align: center;">Please be ready for your session. If you need to reschedule or cancel, please do so at least 2 hours before the session time.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendSessionBookingConfirmation(email: string, studentName: string, tutorName: string, sessionDate: string, startTime: string, endTime: string, sessionType: string = 'lesson') {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: `${sessionType === 'trial' ? 'Trial Lesson' : 'Lesson'} Booking Confirmed - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #28a745; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">${sessionType === 'trial' ? 'Trial Lesson' : 'Lesson'} Booked Successfully!</div>
            </div>
            <h2 style="text-align: center;">Booking Confirmation</h2>
            <p style="text-align: center;">Dear ${studentName},</p>
            <p style="text-align: center;">Your ${sessionType === 'trial' ? 'trial lesson' : 'lesson'} has been successfully booked!</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${sessionType === 'trial' ? 'Trial Lesson' : 'Regular Lesson'}</p>
            </div>
            <p style="text-align: center;">We'll send you reminder notifications before your session. If you need to reschedule or cancel, please do so at least 2 hours before the session time.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendSessionCancellationEmail(email: string, studentName: string, tutorName: string, sessionDate: string, startTime: string, endTime: string, cancelledBy: string, refundEligible: boolean = false) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Session Cancelled - Wiznovy',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #dc3545; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Session Cancelled</div>
            </div>
            <h2 style="text-align: center;">Cancellation Notice</h2>
            <p style="text-align: center;">Dear ${studentName},</p>
            <p style="text-align: center;">Your session has been cancelled ${cancelledBy === 'student' ? 'as requested' : 'by the tutor'}.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
              <p style="margin: 5px 0;"><strong>Cancelled by:</strong> ${cancelledBy === 'student' ? 'You' : 'Tutor'}</p>
            </div>
            ${refundEligible ? 
              '<p style="text-align: center; color: #28a745;"><strong>Good news!</strong> You are eligible for a full refund as the cancellation was made more than 24 hours in advance.</p>' : 
              '<p style="text-align: center; color: #dc3545;">As the cancellation was made less than 24 hours before the session, no refund will be processed.</p>'
            }
            <p style="text-align: center;">You can book a new session anytime from your dashboard.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendSessionRescheduleEmail(email: string, studentName: string, tutorName: string, oldDate: string, oldStartTime: string, oldEndTime: string, newDate: string, newStartTime: string, newEndTime: string, rescheduledBy: string) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: 'Session Rescheduled - Wiznovy',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #17a2b8; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">Session Rescheduled</div>
            </div>
            <h2 style="text-align: center;">Schedule Update</h2>
            <p style="text-align: center;">Dear ${studentName},</p>
            <p style="text-align: center;">Your session has been rescheduled ${rescheduledBy === 'student' ? 'as requested' : 'by the tutor'}.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Previous Schedule:</h4>
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${oldDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${oldStartTime} - ${oldEndTime}</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <h4 style="margin: 0 0 10px 0; color: #0c5460;">New Schedule:</h4>
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${newDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${newStartTime} - ${newEndTime}</p>
            </div>
            
            <p style="text-align: center;">Please make note of the new schedule. We'll send you reminder notifications before your session.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendNewMessageNotification(email: string, studentName: string, tutorName: string, messagePreview: string) {
    try {
      return this.mailService.sendMail({
        to: email,
        subject: `New Message from ${tutorName} - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #007bff; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">New Message Received</div>
            </div>
            <h2 style="text-align: center;">Message from Your Tutor</h2>
            <p style="text-align: center;">Dear ${studentName},</p>
            <p style="text-align: center;">You have received a new message from <strong>${tutorName}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">Message Preview:</h4>
              <p style="margin: 0; font-style: italic; color: #6c757d;">${messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Message</a>
            </div>
            
            <p style="text-align: center;">Log in to your Wiznovy account to read the full message and reply.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
