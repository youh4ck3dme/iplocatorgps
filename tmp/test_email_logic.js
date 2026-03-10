import { sendLocationEmail } from '../lib/email.js';

// Mock process.env for the test
process.env.RESEND_API_KEY = 're_test_key';
process.env.EMAIL_TO = 'larsenevans@proton.me';

const testData = {
    token: 'TEMU_test_user',
    lat: 48.1486,
    lng: 17.1077,
    accuracy: 15,
    deviceInfo: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0...'
    }
};

console.log("Triggering test email log...");
// We expect this to log "Resend notification skipped" or fail, 
// but we want to see the HTML structure if we log it.
sendLocationEmail(testData);
