import {default as os} from 'os';

import {
    getInfo as getInfo,
    ElgatoDevice as ElgatoDevice
} from './api.ts';

/*

*/
function getHostIp(): String {
    const interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        if (!!name) {
            for (const iface of interfaces[name]) {
                if ('IPv4' === iface?.family && !iface?.internal) {
                    return iface.address;
                }
            }
        }
    }

    return '127.0.0.1'; // Default to localhost if no external IP is found
}

/*
    Returns the first 3 octets of the IP
*/
function getHostNetwork(): String {
    const ipOctets = getHostIp().split('.');
    if (ipOctets.length !== 4) {
        return ''
    }

    // Drop the IP of the host
    ipOctets.pop();
    return ipOctets.join('.')
}

/*
    Crawl the available network looking for any Elgato devices that respond
*/
async function elgatoNetworkCrawler(): Promise<ElgatoDevice[]> {
    const elgatoDevices: ElgatoDevice[] = [];
    const hostNetwork = getHostNetwork();
    if (!hostNetwork) return elgatoDevices;

    for (let i = 1; i < 255; i++) {
        const ip: String = `${hostNetwork}.${i}`
        try {
            const elgatoDeviceInfo = await getInfo(ip)
            elgatoDevices.push(elgatoDeviceInfo)
        } catch (e) {
            // Device check timed out
        }
    }

    return elgatoDevices;
}

export async function getLightsOnNetwork() {
    const devices: ElgatoDevice[] = await elgatoNetworkCrawler()
    return devices.filter((device: ElgatoDevice) => device.features.includes('lights'));
}