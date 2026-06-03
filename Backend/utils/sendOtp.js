import nodemailer from 'nodemailer';
import twilio     from 'twilio';
import crypto     from 'crypto';

let _mailer = null;
const getMailer = () => {
    if (_mailer) return _mailer;

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) throw new Error('EMAIL_USER / EMAIL_PASS not set in .env');

    _mailer = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    return _mailer;
};

let _twilio = null;
const getTwilio = () => {
    if (_twilio) return _twilio;

    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set in .env');

    _twilio = twilio(sid, token);
    return _twilio;
};

export const generateOtp = () =>
    crypto.randomInt(100_000, 999_999).toString();

const normalizeMobile = (mobile) => {
    const digits = mobile.toString().replace(/\D/g, ''); // strip non-digits

    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10)                             return `+91${digits}`;
    if (digits.length > 10)                               return `+${digits}`;

    throw new Error(`Invalid mobile number: ${mobile}`);
};

export const sendEmailOtp = async (email, otp) => {
    if (!email) throw new Error('email is required');
    if (!otp)   throw new Error('otp is required');

    await getMailer().sendMail({
        from:    `"Your App" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: 'Your OTP Code',

        text: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;
                        padding:28px;border:1px solid #e5e7eb;border-radius:10px;">
                <h2 style="margin:0 0 8px;color:#111827;">Verification Code</h2>
                <p style="color:#6b7280;margin:0 0 20px;">
                    Use the code below to verify your account.
                    It expires in <strong>5 minutes</strong>.
                </p>
                <div style="font-size:36px;font-weight:700;letter-spacing:10px;
                            color:#4f46e5;padding:16px 0;">
                    ${otp}
                </div>
                <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    });
};

export const sendSmsOtp = async (mobile, otp) => {
    if (!mobile) throw new Error('mobile is required');
    if (!otp)    throw new Error('otp is required');

    const to   = normalizeMobile(mobile);
    const from = process.env.TWILIO_PHONE;
    if (!from) throw new Error('TWILIO_PHONE not set in .env');

    await getTwilio().messages.create({
        body: `Your OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
        from,
        to,
    });
};