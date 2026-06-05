import 'dotenv/config';
import nodemailer from 'nodemailer';
import twilio     from 'twilio';
import crypto     from 'crypto';

const TEST_EMAIL  = 'sahil176111@gmail.com';
const TEST_MOBILE = 7876629917;

const generateOtp = () => crypto.randomInt(100_000, 999_999).toString();

async function testGmail() {
    console.log('\n📧 Testing Gmail...');
    const otp         = generateOtp();
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    try {
        await transporter.verify();
        await transporter.sendMail({
            from:    process.env.EMAIL_USER,
            to:      TEST_EMAIL,
            subject: 'OTP Test',
            text:    `Your OTP is: ${otp}`,
            html:    `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Valid for 5 minutes.</p>`
        });
        console.log(`  ✅ Email sent | OTP: ${otp}`);
    } catch (err) {
        console.error('  ❌ Gmail error:', err.message);
    }
}

async function testTwilio() {
    console.log('\n📱 Testing Twilio SMS...');
    const otp = generateOtp();

    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from:  process.env.TWILIO_PHONE,
            to:   `+91${TEST_MOBILE}`
        });
        console.log(`  ✅ SMS sent | OTP: ${otp}`);
    } catch (err) {
        console.error('  ❌ Twilio error:', err.message);
    }
}

await testGmail();
await testTwilio();