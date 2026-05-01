/**
 * Cron expressions for all scheduled jobs.
 * Format: second minute hour day month weekday
 */
export enum CronExpression {
  EVERY_2_MINUTES  = '0 */2 * * * *',
  EVERY_5_MINUTES  = '0 */5 * * * *',
  EVERY_30_MINUTES = '0 */30 * * * *',
  DAILY_8AM        = '0 0 8 * * *',
  DAILY_9AM        = '0 0 9 * * *',
}

/**
 * Time windows (in minutes) used by cron jobs.
 */
export enum CronTimeWindow {
  TEN_MIN_BEFORE_MIN            = 8,
  TEN_MIN_AFTER_MIN             = 12,
  ZOOM_REMINDER_BEFORE_MIN      = 55,
  ZOOM_REMINDER_AFTER_MIN       = 65,
  REMINDER_24H_BEFORE_MIN       = 23 * 60,
  REMINDER_24H_AFTER_MIN        = 25 * 60,
  SESSION_REMINDER_24H          = 24 * 60,
  SESSION_REMINDER_1H           = 60,
  EXPIRY_WARNING_3_DAYS         = 3,
  EXPIRY_WARNING_1_DAY          = 1,
}
