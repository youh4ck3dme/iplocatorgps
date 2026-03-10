import { Resend } from 'resend';

export async function sendLocationEmail(data) {
    const { token, lat, lng, accuracy, deviceInfo } = data;

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                <!-- Header -->
                <div style="background-color: #fd3c1c; padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📍</div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Nová poloha identifikovaná</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Systém úspešne zachytil GPS súradnice</p>
                </div>

                <!-- Body -->
                <div style="padding: 40px; color: #1a1f36;">
                    <div style="margin-bottom: 30px;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #8792a2; font-weight: 600; letter-spacing: 1px;">ID Relácie (Token)</span>
                        <div style="background: #f4f7fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; margin-top: 5px; color: #fd3c1c; font-weight: bold;">
                            ${token}
                        </div>
                    </div>

                    <div style="display: flex; gap: 20px; margin-bottom: 30px; border: 1px solid #e3e8ee; border-radius: 10px; padding: 20px; background-color: #ffffff;">
                        <div style="flex: 1;">
                            <span style="font-size: 12px; text-transform: uppercase; color: #8792a2; font-weight: 600;">Súradnice</span>
                            <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700;">${lat}, ${lng}</p>
                        </div>
                        <div style="flex: 1; border-left: 1px solid #e3e8ee; padding-left: 20px;">
                            <span style="font-size: 12px; text-transform: uppercase; color: #8792a2; font-weight: 600;">Presnosť</span>
                            <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #059669;">± ${Math.round(accuracy)}m</p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 40px;">
                        <a href="https://www.google.com/maps?q=${lat},${lng}" 
                           style="display: inline-block; background-color: #fd3c1c; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(253, 60, 28, 0.2 transition: background-color 0.2s;">
                           Zobraziť na Google Maps
                        </a>
                    </div>

                    <!-- Device Info Card -->
                    <div style="background-color: #f8fafc; border-radius: 10px; padding: 25px;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #4b5563; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Informácie o zariadení</h3>
                        <table style="width: 100%; font-size: 13px; color: #64748b; border-collapse: collapse;">
                            <tr><td style="padding: 5px 0; font-weight: 600;">Platforma:</td><td>${deviceInfo?.platform || 'N/A'}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: 600;">Čas:</td><td>${new Date().toLocaleString('sk-SK')}</td></tr>
                        </table>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    Tento e-mail bol automaticky vygenerovaný vaším lokačným systémom.<br/>
                    © ${new Date().getFullYear()} Temu Verification Suite
                </div>
            </div>
        </div>
    `;

    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey || apiKey === '' || apiKey.includes('your_api_key')) {
            console.log("Resend notification skipped: No valid API Key provided.");
            return;
        }

        const resend = new Resend(apiKey);
        const recipients = process.env.EMAIL_TO ? process.env.EMAIL_TO.split(',').map(e => e.trim()) : ['larsenevans@proton.me'];

        const { data: emailResponse, error } = await resend.emails.send({
            from: 'Location Tracker <notifications@send.temu.pop-mart.cloud>',
            to: recipients,
            subject: `📍 Úspešný zásah! Nová poloha: ${token}`,
            html: htmlContent
        });

        if (error) {
            console.error("Resend error (API):", error);
            return;
        }

        console.log("Location email sent successfully via Resend to:", recipients.join(', '), emailResponse);
    } catch (error) {
        console.error("Error sending location email via Resend (Runtime):", error.message || error);
    }
}
