const BASE_STYLE = `font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;`;
const CARD_STYLE = `background-color: #ffffff; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);`;
const FOOTER = `<div style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;"><p>Thank you,<br />Wiznovy Team</p></div>`;

function banner(color: string, text: string): string {
  return `<div style="background: ${color}; padding: 30px; border-radius: 4px; color: #fff; text-align: center; margin: 20px 0;"><div style="font-size: 25px;">${text}</div></div>`;
}

function infoBox(rows: string[]): string {
  const rowsHtml = rows.map(r => `<p style="margin: 5px 0;">${r}</p>`).join('');
  return `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">${rowsHtml}</div>`;
}

export function twentyFourHourReminderTemplate(
  firstName: string,
  role: 'student' | 'tutor',
  studentName: string,
  tutorName: string,
  subject: string,
  date: string,
  time: string,
  timezone: string,
  dashboardLink: string,
): string {
  const isStudent = role === 'student';
  const otherParty = isStudent ? tutorName : studentName;
  const bodyText = isStudent
    ? `You have a <strong>${subject}</strong> session with <strong>${otherParty}</strong> tomorrow. Be prepared and ready to join.`
    : `You have a <strong>${subject}</strong> session with student <strong>${otherParty}</strong> tomorrow. Please be ready to host.`;
  const ctaLabel = isStudent ? 'Go to Dashboard' : 'Go to Dashboard';

  return `
  <div style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      ${banner('#ffc107', '📅 Session Tomorrow')}
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>${bodyText}</p>
      ${infoBox([
        `<strong>${isStudent ? 'Tutor' : 'Student'}:</strong> ${otherParty}`,
        `<strong>Date:</strong> ${date}`,
        `<strong>Time:</strong> ${time} (${timezone})`,
      ])}
      <p>Join from your <a href="${dashboardLink}" style="color:#144fa9;font-weight:bold;">${ctaLabel}</a>.</p>
      ${FOOTER}
    </div>
  </div>`;
}

export function expiryWarningTemplate(itemName: string, daysLeft: number): string {
  return `
  <div style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      ${banner('#ffc107', 'Content Expiring Soon!')}
      <h2 style="text-align:center;">Your access expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</h2>
      ${infoBox([`<strong>Content:</strong> ${itemName}`])}
      <p style="text-align:center;">Renew your access to continue learning.</p>
      ${FOOTER}
    </div>
  </div>`;
}

export function expiredTemplate(itemName: string): string {
  return `
  <div style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      ${banner('#dc3545', 'Content Expired')}
      <h2 style="text-align:center;">Your access has expired</h2>
      ${infoBox([`<strong>Content:</strong> ${itemName}`])}
      <p style="text-align:center;">Purchase again to continue your learning journey!</p>
      ${FOOTER}
    </div>
  </div>`;
}

export function zoomLinkReminderTemplate(
  firstName: string,
  subject: string,
  date: string,
  time: string,
  timezone: string,
  zoomLink: string,
  meetingId: string,
  passcode: string,
): string {
  return `
  <div style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      ${banner('#0f3d3e', '🎥 Your Session Starts in 1 Hour')}
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your <strong>${subject}</strong> session is starting soon. Here are your joining details:</p>
      ${infoBox([
        `<strong>Date:</strong> ${date}`,
        `<strong>Time:</strong> ${time} (${timezone})`,
        `<strong>Zoom Link:</strong> <a href="${zoomLink}" style="color:#144fa9;">${zoomLink}</a>`,
        `<strong>Meeting ID:</strong> ${meetingId}`,
        `<strong>Passcode:</strong> ${passcode}`,
      ])}
      <p style="color:#dc3545;"><strong>⚠️ Please join on time.</strong> Sessions will be marked as no-show after a 15-minute grace period.</p>
      ${FOOTER}
    </div>
  </div>`;
}

export function tenMinReminderTemplate(
  firstName: string,
  role: 'student' | 'tutor',
  tutorName: string,
  subject: string,
  zoomLink: string,
): string {
  const isStudent = role === 'student';
  const body = isStudent
    ? `Your <strong>${subject}</strong> session with <strong>${tutorName}</strong> starts in 10 minutes. Join now:`
    : `Your <strong>${subject}</strong> session starts in 10 minutes. Start your meeting now:`;
  const linkLabel = isStudent ? 'Join Session' : 'Start Session';

  return `
  <div style="${BASE_STYLE}">
    <div style="${CARD_STYLE}">
      ${banner('#dc3545', '⏰ Session Starting Now!')}
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>${body}</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${zoomLink}" style="display:inline-block;padding:14px 32px;background-color:#dc3545;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">${linkLabel}</a>
      </div>
      <p style="color:#dc3545;"><strong>⚠️ No-show after 15-minute grace period.</strong></p>
      ${FOOTER}
    </div>
  </div>`;
}
