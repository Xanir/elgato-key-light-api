
import {
    getInfo as getInfo,
    ElgatoDevice as ElgatoDevice
} from './api.ts';

const groups: Map<String, Set<String>> = new Map();
const allDevicesBySerial: Map<String, ElgatoDevice> = new Map();

type DeviceIdentifiers = 'ip' | 'serialNumber';

function getExistingDeviceBy(type: DeviceIdentifiers, value: String): null | ElgatoDevice {
    for (const device of allDevicesBySerial.values()) {
        if (device[type] === value) {
            return device;
        }
    }

    return null;
}

export function getLights(): ElgatoDevice[] {
    const lights: ElgatoDevice[] = [];
    for (const device of allDevicesBySerial.values()) {
        lights.push(device);
    }
    return lights;
}

export function getGroups(): String[] {
    return Array.from(groups.keys());
}

export function getDevicesInGroup(groupName: String): ElgatoDevice[] {
    const deviceIps = groups.get(groupName);
    if (!deviceIps) {return []};
    const devices: ElgatoDevice[] = Array.from(deviceIps).map(ip => getExistingDeviceBy('ip', ip)).filter(d => d !== null && d!== undefined)
    // Clone array before returning
    return devices;
}

export function addDeviceToGroup(groupName: String, serialNumber: String): number {
    const groupNameStr: String = groupName;

    const existingDevice = getExistingDeviceBy('serialNumber', serialNumber);
    if (!existingDevice) {
        return 0;
    }

    let devicesInGroup: Set<String> | undefined = groups.get(groupNameStr);
    // Check if array exists for this group name
    if (!devicesInGroup) {
        // Init a blank array
        devicesInGroup = new Set();
        groups.set(groupNameStr, devicesInGroup);
    }

    devicesInGroup.add(existingDevice.ip)

    return 1;
}

export async function updateActiveDevices(deviceIPs: String[]) {
    for (const ip of deviceIPs) {
        if (Array.from(allDevicesBySerial.values()).filter(device => device.ip === ip).length < 0) continue;

        const device: ElgatoDevice = await getInfo(ip);
        device.ip = ip;
        const existingDevice = getExistingDeviceBy('serialNumber', device.serialNumber);
        if (!existingDevice) {
            allDevicesBySerial.set(device.serialNumber, device);
        }
    }
}
