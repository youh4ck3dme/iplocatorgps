const nodemailer = require('nodemailer');

async function testEmail() {
    const apiKey = 're_jbY915Li_PM9wszTuTmgtErdBhLHKqQd6';
    const fromAddress = 'Location Tracker <notifications@send.pop-mart.cloud>';
    const recipients = ['larsenevans@proton.me', 'zoranbapaunovic@gmail.com'];

    console.log("Starting test email with production sender...");

    const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
            user: 'resend',
            pass: apiKey
        }
    });

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: recipients.join(', '),
            subject: 'Test Email - Location Tracker (Verified Domain)',
            text: 'This is a test email using the verified sender address notifications@send.pop-mart.cloud.'
        });

        console.log("SUCCESS: Email sent!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("FAILURE: Could not send email.");
        console.error("Error Detail:", error.message);
    }
}

testEmail();
