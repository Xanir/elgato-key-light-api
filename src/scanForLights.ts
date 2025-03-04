import {default as os} from 'os';

import {
    getInfo as getInfo,
    ElgatoDevice as ElgatoDevice
} from './api.ts';

import {
    default as getNetworkDefaultDomain
} from './getNetworkDefaultDomain.ts';
/*

/*
    Returns the first 3 octets of the IP
*/
async function getHostNetwork(): Promise<String> {
    const defaultDomain: String = await getNetworkDefaultDomain();
    const ipOctets = defaultDomain.split('.');
    console.log(`Basing subnet off of default network gateway: ${defaultDomain}`)
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
    const hostNetwork = await getHostNetwork();
    if (!hostNetwork) return elgatoDevices;

    for (let i = 1; i < 255; i++) {
        const ip: String = `${hostNetwork}.${i}`
        try {
            const elgatoDeviceInfo = await getInfo(ip)
            elgatoDeviceInfo.ip = ip;
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
