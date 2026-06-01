import nodemailer from 'nodemailer';
import twilio from 'twilio';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
};

export const sendEmailOtp = async (email, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`
    });
};

export const sendSmsOtp = async (mobile, otp) => {
    await twilioClient.messages.create({
        body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: `+91${mobile}`   // adjust country code as needed
    });
};