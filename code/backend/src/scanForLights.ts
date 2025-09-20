import {default as os} from 'os';
import {default as dgram} from 'dgram';
import {default as dnsPacket} from 'dns-packet';

import {
    default as getNetworkDefaultDomain
} from './getNetworkDefaultDomain.ts';
/*


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

async function defaultInterface () {
    var networks = os.networkInterfaces()
    const allInterfaces: os.NetworkInterfaceInfo[] = [];

    for (const interfaceList of Object.values(networks)) {
        interfaceList?.forEach(iface => allInterfaces.push(iface))
    }


    const ipv4Interfaces: os.NetworkInterfaceInfo[] = allInterfaces.filter(iface => iface && !iface.internal && iface.family === 'IPv4')
    if (ipv4Interfaces.length === 1) {
        return ipv4Interfaces[0].address;
    }
    const defaultNetwork = await getNetworkDefaultDomain();
    const networkIP = dropLastOctetOfIP(defaultNetwork);

    const validInterfaces: os.NetworkInterfaceInfo[] = ipv4Interfaces.filter(iface => dropLastOctetOfIP(iface.address) === networkIP)
    return validInterfaces[0].address;
}

async function createSock(multicastAddress: string, mDNSport: number): dgram.Socket {
    const socket: dgram.Socket = dgram.createSocket({
        type: 'udp4',
        reuseAddr: true,
        reusePort: false,
    }); // or 'udp6' for IPv6

    socket.on('error', (err) => {
        socket.close();
    });

    const defaultAddress = await defaultInterface();

    // Create and wait for the socket to be ready
    await new Promise<void>((resolve, reject) => {
        try {
            socket.bind({
                port: mDNSport,
                address: defaultAddress,
                exclusive: false
            }, () => {resolve()})
        } catch (err) {
            console.error(err)
            reject(err)
        }
    })
    socket.addMembership(multicastAddress);
    socket.setBroadcast(true);
    socket.setMulticastLoopback(false); // Enable loopback (receive own messages)

    return socket;
}

async function querydns(multicastAddress: string, question: JSON, timeout: number) {
    return new Promise<String[]>(async (resolve, reject) => {
        try {
            const lightIPs: String[] = [];

            const mDNSport = 5353;

            const socket: dgram.Socket = await createSock(multicastAddress, mDNSport)
            socket.on('message', (message, remote) => {
                const packet = dnsPacket.decode(message)
                const answer = packet.answers ? packet.answers[0] : null
                if (!answer) return
                if (answer.name !== question.name) return

                lightIPs.push(remote.address)
            });

            socket.on('close', () => {
                resolve(lightIPs)
            });

            socket.on('error', (err) => {
                reject(err)
            });

            const message = dnsPacket.encode({
                type: 'query',
                questions: [question]
            })
            socket.send(message, 0, message.length, mDNSport, multicastAddress);

            setTimeout(() => {
                socket.close();
            }, timeout)
        } catch (err) {
            console.error(err)

            reject(err)
        }
    })
}

export async function getLightsOnNetwork() {
    const lightIPs: String[] = await querydns('224.0.0.251', {
        name: '_elg._tcp.local',
        type: 'PTR',
        class: 'IN',
    }, 600)

    return lightIPs;
}
