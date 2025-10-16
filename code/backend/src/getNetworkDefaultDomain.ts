import {exec as exec} from 'child_process';
import {default as os} from 'os';

async function runChildProcess(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout: string, stderr: string) => {
            if (error || stderr) {
                reject(error || stderr);
                return;
            }
            resolve(stdout);
        });
    });;
}

function getPlatformCommand() {
  let command = '';

    switch (process.platform) {
        case 'win32':
            command = 'ipconfig | findstr "Default Gateway"';
            break;
        case 'linux':
        case 'android':
            command = 'ip route | grep default | awk \'{print $3}\'';
            break;
        case 'darwin':
            command = 'netstat -rn | grep default | awk \'{print $2}\'';
            break;
        //For other OS, add respective commands
        default:
            throw new Error(`Unsupported operating system: ${process.platform}`);
    }

  return command;
}

export async function getDefaultGateway(): Promise<String> {
    const command = getPlatformCommand();
    let stdout: string;
    try {
        stdout = await runChildProcess(command);
    } catch (error) {
        throw new Error(`Failed to get default gateway: ${error}`);
    }

    const ipLocator = /(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/g;

    const gatewayIP: RegExpExecArray | null = ipLocator.exec(stdout);
    if (gatewayIP === null) {
        throw new Error('Default Gateway not found in ipconfig output');
    }
    if (ipLocator.exec(stdout) !== null) {
        throw new Error('Multiple default domains detected')
    }

    return gatewayIP[0];
}

/*
    Returns the first 3 octets of the IP
*/
function dropLastOctetOfIP(ip: String) {
    const ipOctets = ip.split('.');
    if (ipOctets.length !== 4) {
        return ''
    }

    // Drop the IP of the host
    ipOctets.pop();
    return ipOctets.join('.')
}

/*
    Determines the default IPv4 interface address for outgoing traffic.
*/
export default async function getDefaultInterface(): Promise<string> {
    const overrideInterface = process.env.DEFAULT_INTERFACE;
    if (overrideInterface) {
        return overrideInterface;
    }

    const networks = os.networkInterfaces()
    const allInterfaces: os.NetworkInterfaceInfo[] = [];

    for (const interfaceList of Object.values(networks)) {
        interfaceList?.forEach(iface => allInterfaces.push(iface))
    }

    const ipv4Interfaces: os.NetworkInterfaceInfo[] = allInterfaces.filter(iface => iface && !iface.internal && iface.family === 'IPv4')
    if (ipv4Interfaces.length === 1) {
        return ipv4Interfaces[0].address;
    }

    // Use default network domain/gateway logic if available to pick the best interface
    const defaultNetwork = await getDefaultGateway();
    const networkIP = dropLastOctetOfIP(defaultNetwork);

    const validInterfaces: os.NetworkInterfaceInfo[] = ipv4Interfaces.filter(iface => dropLastOctetOfIP(iface.address) === networkIP)

    return validInterfaces.length > 0 ? validInterfaces[0].address : '0.0.0.0';
}
