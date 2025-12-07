import axios from 'axios';

export async function sendOtp(phone: number, otp: number) {
  try {
    const msg = encodeURIComponent(
      `Hey, Your OTP is ${otp} for Login way2success App. Please don't share this OTP with anyone. It will expired in next 10 Min. https://way2success.team/ AJIT`,
    );

    const payload = await axios.get(
      `http://nimbusit.biz/api/SmsApi/SendSingleApi?UserID=${process.env.JOB_OTP_USERID}&Password=${process.env.JOB_OTP_PASSWORD}&SenderID=${process.env.JOB_OTP_SENDERID}&Phno=${phone}&Msg=${msg}&EntityID=${process.env.JOB_OTP_ENTITYID}&TemplateID=${process.env.JOB_OTP_TEMPLATE}`,
      {
        headers: {},
      },
    );
    if (payload.data.Status == 'OK') {
      return true;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function sendSMS(phone: number, message: string) {
  try {
    const msg = encodeURIComponent(message);

    const payload = await axios.get(
      `http://nimbusit.biz/api/SmsApi/SendSingleApi?UserID=${process.env.JOB_OTP_USERID}&Password=${process.env.JOB_OTP_PASSWORD}&SenderID=${process.env.JOB_OTP_SENDERID}&Phno=${phone}&Msg=${msg}&EntityID=${process.env.JOB_OTP_ENTITYID}&TemplateID=${process.env.JOB_OTP_TEMPLATE}`,
      {
        headers: {},
      },
    );
    if (payload.data.Status == 'OK') {
      return true;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}
