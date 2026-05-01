import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';

export interface SessionBookingConfirmationDto {
  email: string;
  studentName: string;
  tutorName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType?: string;
  zoomLink?: string;
  meetingId?: string;
  passcode?: string;
}

@Injectable()
export class NodeMailerService {
  private readonly logger = new Logger(NodeMailerService.name);

  constructor(
    private readonly mailService: MailerService,
    private readonly settingsService: SettingsService,
  ) {}

  private async isEmailEnabled(): Promise<boolean> {
    const settings = await this.settingsService.getSettings();
    return settings?.emailEnabled ?? true;
  }

  private async send(options: Parameters<MailerService['sendMail']>[0]): Promise<void> {
    if (!await this.isEmailEnabled()) {
      this.logger.warn(`Email sending is disabled. Skipping mail to ${options.to}`);
      return;
    }
    await this.mailService.sendMail(options);
  }

  async sendEmail(name: string, email: string) {
    try {
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending email:', error);
    }
  }

  async sendOtpInEmail(email: string, otp: string) {
    try {
      return await this.mailService.sendMail({
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
        <h2>Dear </h2>
        <p>Your One-Time Password (OTP) for verification is:</p>
        <div class="otp-code">${otp}</div>
        <p class="mt-4">
          Please use this OTP to complete your verification. The OTP is valid
          for the next 2 minutes.
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
      this.logger.error('Error sending OTP email:', error);
    }
  }

  async welcomeMail(email: string, name: string, joinDate: string) {
    const dashboardLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'https://wiznovy.com/dashboard';
    try {
      return await this.mailService.sendMail({
        to: email,
        from: 'wiznovy@gmail.com',
        subject: 'Welcome to Wiznovy!',
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Wiznovy</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; }
    .container { background-color: #ffffff; border-radius: 8px; padding: 30px; margin: auto; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #144fa9; padding: 30px; border-radius: 6px; text-align: center; margin-bottom: 25px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; }
    p { font-size: 15px; color: #333; line-height: 1.7; }
    .btn { display: inline-block; padding: 12px 30px; background-color: #144fa9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 20px 0; }
    .footer { margin-top: 25px; font-size: 13px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Wiznovy!</h1>
    </div>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to Wiznovy! Your student account has been created successfully.</p>
    <p>Explore tutors, browse courses, and start your learning journey today.</p>
    <div style="text-align: center;">
      <a href="${dashboardLink}" class="btn">Go to Dashboard</a>
    </div>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Happy learning!<br><strong>The Wiznovy Team</strong></p>
    <div class="footer">
      <p>Wiznovy Inc. | wiznovy@gmail.com</p>
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      throw new NotAcceptableException('Error in sending email');
    }
  }

  async tutorRegistrationMail(email: string, name: string, joinDate: string) {
  try {
    return await this.mailService.sendMail({
      to: email,
      from: 'wiznovy@gmail.com',
      subject: 'Welcome to Wiznovy - Application Submitted',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tutor Application Submitted - Wiznovy</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; }
    .container { background-color: #ffffff; border-radius: 8px; padding: 30px; margin: auto; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #144fa9; padding: 30px; border-radius: 6px; text-align: center; margin-bottom: 25px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    p { font-size: 15px; color: #333; line-height: 1.7; }
    .status-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 6px; margin: 20px 0; }
    .status-box p { margin: 0; color: #856404; font-weight: bold; }
    .steps { background-color: #f0f4ff; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .steps p { margin: 6px 0; font-size: 14px; color: #333; }
    .footer { margin-top: 25px; font-size: 13px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Submitted!</h1>
    </div>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for applying to teach on Wiznovy! Your tutor application has been submitted and is currently under review.</p>
    <div class="status-box">
      <p>⏳ Status: Under Review</p>
    </div>
    <p>Our team will verify your credentials and notify you once your profile is approved. This usually takes <strong>1-2 business days</strong>.</p>
    
      <p>Wiznovy Inc. | wiznovy@gmail.com</p>
    </div>
  </div>
</body>
</html>
      `,
    });
  } catch (error) {
    this.logger.error('Error sending tutor registration email:', error);
    throw new NotAcceptableException('Error in sending tutor registration email');
  }
}



  async purchaseSuccessEmail(email: string, studentName: string, itemName: string, amount: number, transactionId: string, date: string, invoiceBuffer?: Buffer) {
    try {
      const mailOptions: any = {
        to: email,
        subject: `Payment confirmed - $${amount}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #28a745; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">✅ Payment Confirmed!</h1>
            </div>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Your payment of <strong>$${amount}</strong> has been processed successfully.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              <p style="margin: 6px 0;"><strong>Details:</strong> ${itemName}</p>
              <p style="margin: 6px 0;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 6px 0;"><strong>Amount:</strong> $${amount}</p>
            </div>
            ${invoiceBuffer ? '<p>Your invoice is attached to this email.</p>' : ''}
            <p>View your payment history in the Dashboard.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      };
      if (invoiceBuffer) {
        mailOptions.attachments = [{ filename: `invoice-${transactionId}.pdf`, content: invoiceBuffer, contentType: 'application/pdf' }];
      }
      return await this.mailService.sendMail(mailOptions);
    } catch (error) {
      this.logger.error('Error sending purchase success email:', error);
    }
  }

  async sendPaymentPendingEmail(email: string, studentName: string, itemName: string, amount: number, transactionId: string, invoiceBuffer?: Buffer) {
    try {
      const mailOptions: any = {
        to: email,
        subject: `Payment pending - $${amount}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #ffc107; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #000; margin: 0; font-size: 22px;">⏳ Payment Pending</h1>
            </div>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Your payment of <strong>$${amount}</strong> is currently being processed.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
              <p style="margin: 6px 0;"><strong>Details:</strong> ${itemName}</p>
              <p style="margin: 6px 0;"><strong>Status:</strong> Pending</p>
            </div>
            ${invoiceBuffer ? '<p>Your payment record is attached to this email.</p>' : ''}
            <p>We will notify you once the payment is confirmed.</p>
            <p>Contact <a href="mailto:support@wiznovy.com" style="color: #144fa9;">support@wiznovy.com</a> if this takes longer than expected.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      };
      if (invoiceBuffer) {
        mailOptions.attachments = [{ filename: 'payment-record.pdf', content: invoiceBuffer, contentType: 'application/pdf' }];
      }
      return await this.mailService.sendMail(mailOptions);
    } catch (error) {
      this.logger.error('Error sending payment pending email:', error);
    }
  }

  async expiryWarningEmail(email: string, itemName: string, daysLeft: number) {
    try {
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending expiry warning email:', error);
    }
  }

  async expiredEmail(email: string, itemName: string) {
    try {
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending expired email:', error);
    }
  }

  async sendAccountLockNotification(email: string, unlockTime: Date) {
    try {
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending account lock notification:', error);
    }
  }

  async sendAccountStatusEmail(email: string, role: string, status: string, message: string) {
    try {
      const statusColors = {
        'ACTIVE': '#28a745',
        'DEACTIVE': '#ffc107',
        'SUSPENDED': '#dc3545',
        'PENDING': '#17a2b8',
        'DELETED': '#6c757d'
      };

      return await this.mailService.sendMail({
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
      this.logger.error('Error sending account status email:', error);
    }
  }

  async sendSessionReminder(email: string, studentName: string, tutorName: string, sessionDate: string, startTime: string, endTime: string, hoursUntil: number) {
    try {
      const reminderType = hoursUntil === 24 ? '24 Hour' : '1 Hour';
      const urgencyColor = hoursUntil === 1 ? '#dc3545' : '#ffc107';
      
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending session reminder:', error);
    }
  }

  async sendSessionBookingConfirmation(dto: SessionBookingConfirmationDto) {
    const { email, studentName, tutorName, sessionDate, startTime, endTime, sessionType = 'lesson', zoomLink, meetingId, passcode } = dto;
    try {
      return await this.mailService.sendMail({
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
            ${zoomLink ? `
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="margin: 0 0 15px 0; color: #0056b3;">🎥 Zoom Meeting Details</h3>
              <p style="margin: 5px 0;"><strong>Join URL:</strong> <a href="${zoomLink}" style="color: #007bff; word-break: break-all;">${zoomLink}</a></p>
              ${meetingId ? `<p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${meetingId}</p>` : ''}
              ${passcode ? `<p style="margin: 5px 0;"><strong>Passcode:</strong> ${passcode}</p>` : ''}
              <div style="background-color: #fff; padding: 10px; border-radius: 5px; margin-top: 10px;">
                <p style="margin: 0; font-size: 12px; color: #666;">💡 <strong>Tips:</strong></p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">• Join 5 minutes early to test your audio/video</p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">• Ensure stable internet connection</p>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">• Have your learning materials ready</p>
              </div>
            </div>
            ` : ''}
            <p style="text-align: center;">We'll send you reminder notifications before your session. If you need to reschedule or cancel, please do so at least 2 hours before the session time.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending session booking confirmation:', error);
    }
  }

  async sendSessionCancellationEmail(email: string, studentName: string, tutorName: string, sessionDetails: { date: string; startTime: string; endTime: string }, cancelledBy: string, refundEligible: boolean = false) {
    try {
      return await this.mailService.sendMail({
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
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDetails.date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionDetails.startTime} - ${sessionDetails.endTime}</p>
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
      this.logger.error('Error sending session cancellation email:', error);
    }
  }

  async sendSessionRescheduleEmail(email: string, studentName: string, tutorName: string, oldSchedule: { date: string; startTime: string; endTime: string }, newSchedule: { date: string; startTime: string; endTime: string }, rescheduledBy: string, subject?: string, timezone?: string) {
    try {
      const subjectLine = rescheduledBy === 'tutor' ? 'Session rescheduled successfully' : 'Session Rescheduled - Wiznovy';
      const timezone_ = timezone || process.env.APP_TIMEZONE || 'UTC';
      return await this.mailService.sendMail({
        to: email,
        subject: subjectLine,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #17a2b8; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Session Rescheduled</h1>
            </div>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Your${subject ? ` <strong>${subject}</strong>` : ''} session has been successfully rescheduled.</p>
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 5px 0; font-weight: bold; color: #856404;">Previous Schedule</p>
              <p style="margin: 4px 0;">${oldSchedule.date} at ${oldSchedule.startTime}</p>
            </div>
            <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 5px 0; font-weight: bold; color: #0c5460;">New Schedule</p>
              <p style="margin: 4px 0;">${newSchedule.date} at ${newSchedule.startTime} (${timezone_})</p>
            </div>
            <p>No charges have been applied.</p>
            <p>An updated Zoom link will be shared shortly.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Regards,<br/>Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending session reschedule email:', error);
    }
  }

  async sendNewMessageNotification(email: string, studentName: string, tutorName: string, messagePreview: string) {
    try {
      return await this.mailService.sendMail({
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
      this.logger.error('Error sending new message notification:', error);
    }
  }

  async sendPayoutRequestEmail(email: string, tutorName: string, amount: number) {
    try {
      return await this.mailService.sendMail({
        to: email,
        subject: `Payout request received: $${amount}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Payout Request Received</h1>
            </div>
            <p>Hi <strong>${tutorName}</strong>,</p>
            <p>Your payout of <strong>$${amount}</strong> has been submitted and is currently being reviewed.</p>
            <p>You will receive a confirmation once it has been processed.</p>
            <p><strong>Estimated time:</strong> 3–5 business days.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Regards,<br/>Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending payout request email:', error);
    }
  }

  async sendPayoutStatusEmail(email: string, tutorName: string, amount: number, status: 'APPROVED' | 'REJECTED', transactionId?: string, rejectionReason?: string) {
    try {
      const statusColors = {
        'APPROVED': '#28a745',
        'REJECTED': '#dc3545'
      };

      const statusTitle = status === 'APPROVED' ? 'Payout Approved' : 'Payout Rejected';
      
      return await this.mailService.sendMail({
        to: email,
        subject: `${statusTitle} - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: ${statusColors[status]}; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">${statusTitle}</div>
            </div>
            <h2 style="text-align: center;">Payout Request Update</h2>
            <p style="text-align: center;">Dear ${tutorName},</p>
            <p style="text-align: center;">Your payout request for <strong>$${amount}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
            
            ${status === 'APPROVED' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
              ${transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Status:</strong> Processed</p>
            </div>
            <p style="text-align: center;">The funds have been transferred to your registered bank account. Please allow 2-5 business days for the amount to reflect in your account.</p>
            ` : `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Rejected</p>
              ${rejectionReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            </div>
            <p style="text-align: center;">If you have any questions regarding this rejection, please contact our support team.</p>
            `}
            
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending payout status email:', error);
    }
  }

  async sendCourseEnrollmentNotification(email: string, tutorName: string, studentName: string, courseName: string, amount: number) {
    try {
      return await this.mailService.sendMail({
        to: email,
        subject: `New Course Enrollment - ${courseName}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #28a745; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">New Course Enrollment!</div>
            </div>
            <h2 style="text-align: center;">Congratulations!</h2>
            <p style="text-align: center;">Dear ${tutorName},</p>
            <p style="text-align: center;">Great news! A new student has enrolled in your course.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 5px 0;"><strong>Course:</strong> ${courseName}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
              <p style="margin: 5px 0;"><strong>Enrollment Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p style="text-align: center;">You can now start engaging with your new student. Check your dashboard for more details.</p>
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending course enrollment notification:', error);
    }
  }

  async sendUserSessionConfirmation(email: string, userName: string, tutorName: string, sessionDate: string, startTime: string, endTime: string, zoomDetails: { joinUrl?: string; meetingId?: string; passcode?: string }) {
    try {
      console.log('📧 USER EMAIL - Zoom Details:', {
        email,
        userName,
        tutorName,
        zoomDetails: {
          joinUrl: zoomDetails?.joinUrl || 'NOT_PROVIDED',
          meetingId: zoomDetails?.meetingId || 'NOT_PROVIDED',
          passcode: zoomDetails?.passcode || 'NOT_PROVIDED'
        }
      });
      return await this.mailService.sendMail({
        to: email,
        subject: `Session Confirmed - Join Details - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #28a745; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">📚 Session Confirmed!</div>
            </div>
            <h2 style="text-align: center;">Ready to Learn!</h2>
            <p style="text-align: center;">Dear ${userName},</p>
            <p style="text-align: center;">Your session has been confirmed and payment processed successfully!</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">📅 Session Details</h3>
              <p style="margin: 5px 0;"><strong>Tutor:</strong> ${tutorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745;">✅ Confirmed & Paid</span></p>
            </div>
            
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="margin: 0 0 15px 0; color: #0056b3;">🎥 Join Your Session</h3>
              ${zoomDetails.meetingId ? `<p style="margin: 5px 0;"><strong>Meeting ID:</strong> <span style="font-family: monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${zoomDetails.meetingId}</span></p>` : ''}
              ${zoomDetails.passcode ? `<p style="margin: 5px 0;"><strong>Passcode:</strong> <span style="font-family: monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${zoomDetails.passcode}</span></p>` : ''}
              
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #0056b3;">📋 Student Checklist:</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Join 5 minutes early</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Test your microphone and camera</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Have your learning materials ready</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Ensure stable internet connection</p>
              </div>
            </div>
            
            ${zoomDetails.joinUrl ? `<div style="text-align: center; margin: 30px 0;">
              <a href="${zoomDetails.joinUrl}" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">📚 Join Session</a>
            </div>` : ''}
            
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Questions? Contact our support team anytime.</p>
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending user session confirmation:', error);
    }
  }

  async sendCourseRejectedEmail(dto: {
    email: string;
    tutorName: string;
    courseName: string;
    rejectionReason: string;
    editLink: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `Your course needs revisions`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #dc3545; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Course Needs Revisions</h1>
            </div>
            <p>Hi <strong>${dto.tutorName}</strong>,</p>
            <p><strong>${dto.courseName}</strong> reviewed but requires changes.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Reason:</strong> ${dto.rejectionReason}</p>
            </div>
            <p>Update and resubmit: <a href="${dto.editLink}" style="color: #144fa9; font-weight: bold;">${dto.editLink}</a></p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending course rejected email:', error);
    }
  }

  async sendCourseApprovedEmail(dto: {
    email: string;
    tutorName: string;
    courseName: string;
    courseLink: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `Your course has been approved!`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #28a745; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Course Approved!</h1>
            </div>
            <p>Hi <strong>${dto.tutorName}</strong>,</p>
            <p><strong>${dto.courseName}</strong> reviewed and approved. Now visible to students in Browse Courses.</p>
            <p>View: <a href="${dto.courseLink}" style="color: #144fa9; font-weight: bold;">${dto.courseLink}</a></p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending course approved email:', error);
    }
  }

  async sendTutorCourseEnrollmentNotification(dto: {
    email: string;
    tutorName: string;
    studentName: string;
    courseName: string;
    enrollmentCount: number;
    dashboardLink: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `New enrollment in ${dto.courseName}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Enrollment!</h1>
            </div>
            <p>Hi <strong>${dto.tutorName}</strong>,</p>
            <p><strong>${dto.studentName}</strong> enrolled in <strong>${dto.courseName}</strong>.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Total enrollments:</strong> ${dto.enrollmentCount}</p>
            </div>
            <p>View analytics in <a href="${dto.dashboardLink}" style="color: #144fa9; font-weight: bold;">Dashboard</a>.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending tutor course enrollment notification:', error);
    }
  }

  async sendCourseEnrollmentConfirmation(dto: {
    email: string;
    studentName: string;
    courseName: string;
    tutorName: string;
    amount: number;
    courseLink: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `You are enrolled in ${dto.courseName}!`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Enrollment Confirmed!</h1>
            </div>
            <p>Hi <strong>${dto.studentName}</strong>,</p>
            <p>You are enrolled in <strong>${dto.courseName}</strong> by <strong>${dto.tutorName}</strong>.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Amount:</strong> $${dto.amount}</p>
            </div>
            <p>Access from My Learnings: <a href="${dto.courseLink}" style="color: #144fa9; font-weight: bold;">${dto.courseLink}</a></p>
            <p>Happy learning!</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending course enrollment confirmation:', error);
    }
  }

  async sendPaymentFailedEmail(email: string, studentName: string, amount: number, failureReason: string, invoiceBuffer?: Buffer) {
    const paymentLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/payments` : 'https://wiznovy.com/dashboard/payments';
    try {
      const mailOptions: any = {
        to: email,
        subject: 'Payment failed - action needed',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #dc3545; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Payment Failed</h1>
            </div>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Unable to process <strong>$${amount}</strong>.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Reason:</strong> ${failureReason}</p>
            </div>
            ${invoiceBuffer ? '<p>Your payment record is attached to this email.</p>' : ''}
            <p>Update your payment method: <a href="${paymentLink}" style="color: #144fa9; font-weight: bold;">${paymentLink}</a></p>
            <p>Your booking is held for <strong>24 hours</strong>.</p>
            <p>Contact <a href="mailto:support@wiznovy.com" style="color: #144fa9;">support@wiznovy.com</a> if issue persists.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      };
      if (invoiceBuffer) {
        mailOptions.attachments = [{ filename: 'payment-record.pdf', content: invoiceBuffer, contentType: 'application/pdf' }];
      }
      return await this.mailService.sendMail(mailOptions);
    } catch (error) {
      this.logger.error('Error sending payment failed email:', error);
    }
  }

  async sendTutorTrialSessionNotification(dto: {
    email: string;
    tutorName: string;
    studentName: string;
    subject: string;
    date: string;
    time: string;
    timezone: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `New trial session: ${dto.subject} with ${dto.studentName}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Trial Session Booked!</h1>
            </div>
            <p>Hi <strong>${dto.tutorName}</strong>,</p>
            <p><strong>${dto.studentName}</strong> booked a 25-minute trial for <strong>${dto.subject}</strong>.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Date:</strong> ${dto.date}</p>
              <p style="margin: 6px 0;"><strong>Time:</strong> ${dto.time} (${dto.timezone})</p>
            </div>
            <p>Make a great first impression!</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending tutor trial session notification:', error);
    }
  }

  async sendTrialSessionConfirmation(dto: {
    email: string;
    studentName: string;
    tutorName: string;
    subject: string;
    date: string;
    time: string;
    timezone: string;
    amount: number;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `Your trial session with ${dto.tutorName} is confirmed`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Trial Session Confirmed!</h1>
            </div>
            <p>Hi <strong>${dto.studentName}</strong>,</p>
            <p>Your 25-minute trial with <strong>${dto.tutorName}</strong> for <strong>${dto.subject}</strong> is confirmed!</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Date:</strong> ${dto.date}</p>
              <p style="margin: 6px 0;"><strong>Time:</strong> ${dto.time} (${dto.timezone})</p>
              <p style="margin: 6px 0;"><strong>Amount:</strong> $${dto.amount}</p>
            </div>
            <p>Great opportunity to see if <strong>${dto.tutorName}</strong> is the right fit.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending trial session confirmation:', error);
    }
  }

  async sendSessionBookingNotification(dto: {
    email: string;
    recipientName: string;
    tutorName: string;
    studentName: string;
    subject: string;
    date: string;
    time: string;
    timezone: string;
    duration: number;
    dashboardLink: string;
  }) {
    try {
      return await this.mailService.sendMail({
        to: dto.email,
        subject: `New session booking: ${dto.subject} with ${dto.studentName}`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Session Booking</h1>
            </div>
            <p>Hi <strong>${dto.recipientName}</strong>,</p>
            <p><strong>${dto.studentName}</strong> has booked a <strong>${dto.subject}</strong> session.</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Date:</strong> ${dto.date}</p>
              <p style="margin: 6px 0;"><strong>Time:</strong> ${dto.time} (${dto.timezone})</p>
              <p style="margin: 6px 0;"><strong>Duration:</strong> ${dto.duration} min</p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${dto.dashboardLink}" style="display: inline-block; padding: 12px 30px; background-color: #144fa9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
            </div>
            <div style="color: #6c757d; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending session booking notification:', error);
    }
  }

  async sendProfileUpdateEmail(email: string, firstName: string, changesList: string[]) {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const changesHtml = changesList.map(c => `<li>${c}</li>`).join('');
    try {
      return await this.mailService.sendMail({
        to: email,
        subject: 'Your profile has been updated',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
            <div style="background: #144fa9; padding: 25px; border-radius: 6px; color: #fff; text-align: center; margin-bottom: 20px;">
              <div style="font-size: 22px;">Profile Updated</div>
            </div>
            <p>Hi <strong>${firstName}</strong>,</p>
            <p>Your profile was updated on <strong>${date}</strong>.</p>
            <p><strong>Changes made:</strong></p>
            <ul>${changesHtml}</ul>
            <p style="color: #dc3545;">If you did not make these changes, contact support immediately at <a href="mailto:support@wiznovy.com">support@wiznovy.com</a>.</p>
            <div style="color: #6c757d; font-size: 13px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
              <p>Wiznovy Team</p>
            </div>
          </div>
        </div>`,
      });
    } catch (error) {
      this.logger.error('Error sending profile update email:', error);
    }
  }

  async sendTutorSessionConfirmation(email: string, tutorName: string, studentName: string, sessionDate: string, startTime: string, endTime: string, zoomDetails: { startUrl?: string; meetingId?: string; passcode?: string }) {
    try {
      console.log('📧 TUTOR EMAIL - Zoom Details:', {
        email,
        tutorName,
        studentName,
        zoomDetails: {
          startUrl: zoomDetails?.startUrl || 'NOT_PROVIDED',
          meetingId: zoomDetails?.meetingId || 'NOT_PROVIDED',
          passcode: zoomDetails?.passcode || 'NOT_PROVIDED'
        }
      });
      return await this.mailService.sendMail({
        to: email,
        subject: `New Session Booked - Host Details - Wiznovy`,
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
            <div style="background: #007bff; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0px;">
              <div style="font-size: 25px;">🎯 New Session Booked!</div>
            </div>
            <h2 style="text-align: center;">Ready to Teach!</h2>
            <p style="text-align: center;">Dear ${tutorName},</p>
            <p style="text-align: center;">Great news! A new session has been booked with you.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">📅 Session Details</h3>
              <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745;">✅ Confirmed & Paid</span></p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin: 0 0 15px 0; color: #856404;">🎥 Host Your Session</h3>
              ${zoomDetails.meetingId ? `<p style="margin: 5px 0;"><strong>Meeting ID:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 3px;">${zoomDetails.meetingId}</span></p>` : ''}
              ${zoomDetails.passcode ? `<p style="margin: 5px 0;"><strong>Passcode:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 3px;">${zoomDetails.passcode}</span></p>` : ''}
              
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">📋 Tutor Checklist:</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Join 10 minutes early to set up</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Prepare lesson materials</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Test screen sharing if needed</p>
                <p style="margin: 5px 0; font-size: 14px;">✓ Have backup contact ready</p>
              </div>
            </div>
            
            ${zoomDetails.startUrl ? `<div style="text-align: center; margin: 30px 0;">
              <a href="${zoomDetails.startUrl}" style="display: inline-block; padding: 15px 30px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">🎯 Start Teaching</a>
            </div>` : ''}
            
            <div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
              <p>Questions? Contact our support team anytime.</p>
              <p>Thank you,<br />Wiznovy Team</p>
            </div>
          </div>
        </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error sending tutor session confirmation:', error);
    }
  }
}
