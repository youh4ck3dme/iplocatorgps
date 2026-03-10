import { Resend } from 'resend';

export async function sendLocationEmail(data) {
    const { token, lat, lng, accuracy, deviceInfo } = data;

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;">
            <h2 style="color: #7c3aed; margin-top: 0;">📍 New Location Captured</h2>
            <p style="font-size: 16px;"><strong>Token:</strong> <code style="background: #f4f4f4; padding: 2px 4px; border-radius: 4px;">${token}</code></p>
            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>Coordinates:</strong> <a href="https://www.google.com/maps?q=${lat},${lng}" style="color: #7c3aed; text-decoration: none; font-weight: bold;">${lat}, ${lng}</a></p>
                <p style="margin: 5px 0;"><strong>Accuracy:</strong> ${accuracy}m</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; line-height: 1.6;">
                <strong>Platform:</strong> ${deviceInfo?.platform || 'N/A'}<br/>
                <strong>User Agent:</strong> ${deviceInfo?.userAgent || 'N/A'}<br/>
                <strong>Captured At:</strong> ${new Date().toLocaleString()}
            </p>
            <a href="https://www.google.com/maps?q=${lat},${lng}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">View on Google Maps</a>
        </div>
    `;

    try {
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_api_key')) {
            console.log("Resend notification skipped: No API Key provided.");
            return;
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data: emailResponse, error } = await resend.emails.send({
            from: 'Location Tracker <onboarding@resend.dev>',
            to: process.env.EMAIL_TO || 'larsenevans@proton.me',
            subject: `📍 New Location Captured: ${token}`,
            html: htmlContent
        });

        if (error) {
            console.error("Resend error:", error);
            return;
        }

        console.log("Location email sent successfully via Resend", emailResponse);
    } catch (error) {
        console.error("Error sending location email via Resend:", error);
    }
}
