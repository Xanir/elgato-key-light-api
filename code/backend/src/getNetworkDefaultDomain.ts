import {exec as exec} from 'child_process';

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

export default async function getDefaultGateway(): Promise<String> {
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