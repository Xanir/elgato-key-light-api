
import {
    getInfo as getInfo,
    ElgatoDevice as ElgatoDevice
} from './api.ts';

const groups: Map<string, ElgatoDevice[]> = new Map();
const allDevicesBySerial: Map<String, ElgatoDevice> = new Map();

type DeviceIdentifiers = 'ip' | 'serialNumber';

function getExistingDeviceBy(type: DeviceIdentifiers, value: String): null | ElgatoDevice {
    console.log(allDevicesBySerial)
    for (const device of allDevicesBySerial.values()) {
        console.log(device[type])
        console.log(value)
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

export function getDevicesInGroup(groupName: String): ElgatoDevice[] {
    const devices = groups.get(groupName.toString());
    if (!devices) {return []};
    // Clone array before returning
    return Array.from(devices);
}

export function addDeviceToGroup(groupName: String, serialNumber: String): void {
    const groupNameStr: string = groupName.toString();

    const existingDevice = getExistingDeviceBy('serialNumber', serialNumber);
    if (!existingDevice) {
        return;
    }

    let devicesInGroup = groups.get(groupNameStr);
    // Check if array exists for this group name
    if (!devicesInGroup) {
        // Init a blank array
        devicesInGroup = [];
        groups.set(groupNameStr, devicesInGroup);
    }

    const deviceMatch = devicesInGroup.filter(device => device === device);

    // Check if device is already in the list
    if (deviceMatch && deviceMatch.length) {
        // Device exists, abort
        return;
    }

    // Device does not exist in the list so add it
    devicesInGroup.push(existingDevice);
}

export async function updateActiveDevices(deviceIPs: String[]) {
    for (const ip of deviceIPs) {
        const device: ElgatoDevice = await getInfo(ip);
        device.ip = ip;
        const existingDevice = getExistingDeviceBy('serialNumber', device.serialNumber);
        if (!existingDevice) {
            allDevicesBySerial.set(device.serialNumber, device);
        }
    }
}
