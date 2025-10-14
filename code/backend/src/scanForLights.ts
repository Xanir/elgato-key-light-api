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

/*
    Determines the default IPv4 interface address for outgoing traffic.
*/
async function defaultInterface () {
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
    const defaultNetwork = await getNetworkDefaultDomain();
    const networkIP = dropLastOctetOfIP(defaultNetwork);

    const validInterfaces: os.NetworkInterfaceInfo[] = ipv4Interfaces.filter(iface => dropLastOctetOfIP(iface.address) === networkIP)

    return validInterfaces.length > 0 ? validInterfaces[0].address : '0.0.0.0';
}

async function createSock(multicastAddress: string, mDNSport: number): Promise<dgram.Socket> {
    const socket: dgram.Socket = dgram.createSocket({
        type: 'udp4',
        reuseAddr: true,
        reusePort: true,
    });

    socket.on('error', (err) => {
        socket.close();
        throw err;
    });

    const defaultAddress = await defaultInterface();
    console.log(`socket default interface: ${defaultAddress}`)

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
    });

    socket.setMulticastInterface(defaultAddress)
    socket.addMembership(multicastAddress, defaultAddress);
    socket.setBroadcast(true);
    socket.setMulticastLoopback(false); // Enable loopback (receive own messages)

    return socket;
}

async function querydns(multicastAddress: string, question: JSON, timeout: number): Promise<String[]> {
    const lightIPs: String[] = [];
    const mDNSport = 5353;

    const socket: dgram.Socket = await createSock(multicastAddress, mDNSport);
    socket.on('message', (message, remote) => {
        const packet = dnsPacket.decode(message)
        const answer = packet.answers ? packet.answers[0] : null
        if (!answer) return
        if (answer.name !== question.name) return

        lightIPs.push(remote.address)
    });

    socket.on('error', (err) => {
        socket.close();
        throw err
    });

    const message = dnsPacket.encode({
        type: 'query',
        questions: [question]
    })
    console.log(`mDNS ${socket.address().address}:${socket.address().port} ${question.name}`)

    await new Promise<void>(async (resolve, reject) => {
        socket.send(message, 0, message.length, mDNSport, multicastAddress, () => {resolve()});
    })

    setTimeout(() => {
        socket.close();
    }, timeout)

    return await new Promise<String[]>((resolve, reject) => {
        socket.on('close', () => {
            resolve(lightIPs)
        });
    })
}

export async function getLightsOnNetwork() {
    let lightIPs: String[] = await querydns('224.0.0.251', {
        name: '_elg._tcp.local',
        type: 'PTR',
        class: 'IN',
    }, 900)

    return lightIPs;
}
