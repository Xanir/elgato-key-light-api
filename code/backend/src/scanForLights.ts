import {default as dgram} from 'dgram';
import {default as dnsPacket} from 'dns-packet';

import {
    updateActiveDevices as updateActiveDevices
} from './deviceManager.ts'

import {
    default as getDefaultInterface
} from './getNetworkDefaultDomain.ts';

const multicastPort: number = 5353;
const multicastAddress: string = '224.0.0.251';

interface mDNSquery {
    name: String
    type: 'PTR' | 'A'
    class: 'IN'
}
const mDNSelgatoQuery: mDNSquery = {
    name: '_elg._tcp.local',
    type: 'PTR',
    class: 'IN',
}

const defaultAddressP: Promise<string> = getDefaultInterface();
const multicastSocketP: Promise<dgram.Socket> = createSock('224.0.0.251', 5353);

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

    const defaultAddress = await defaultAddressP;

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

    socket.addMembership(multicastAddress, defaultAddress);
    socket.setBroadcast(true);
    socket.setMulticastLoopback(false); // Enable loopback (receive own messages)

    return socket;
}

let isInit: true | false = false;
export async function init(): Promise<void> {
    if (!isInit) {
        isInit = true
    }

    const socket: dgram.Socket = await multicastSocketP;

    socket.on('message', (message, remote) => {
        if (remote.family == 'IPv4') {
            const packet = dnsPacket.decode(message)
            const answer = packet.answers ? packet.answers[0] : null
            if (
                !answer ||
                answer.name !== mDNSelgatoQuery.name ||
                !packet.additionals ||
                packet.additionals.length === 0
            ) return

            const additialRecordWithIp = packet.additionals.filter((record => record.type === 'A'))
            if (additialRecordWithIp.length !== 1) return

            const ipForLight = additialRecordWithIp[0].data
            try {
                updateActiveDevices([ipForLight])
            } catch (err) {
                console.error(`failed to get data for light at: ${ipForLight}`)
            }
        }
    })
    socket.on('close', () => {
        console.error('the log socket is closed?')
    })

    const message = dnsPacket.encode({
        type: 'query',
        questions: [mDNSelgatoQuery]
    })

    setInterval(() => {
        socket.send(message, 0, message.length, multicastPort, multicastAddress)
    }, 5000)
}

async function wait(time: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, time)
    })
}

export async function forceQuery(): Promise<void> {
    if (!isInit) {
        init();
    } else {
        const socket: dgram.Socket = await multicastSocketP;
        const message = dnsPacket.encode({
            type: 'query',
            questions: [mDNSelgatoQuery]
        })

        socket.send(message, 0, message.length, multicastPort, multicastAddress)
        await wait(600)
    }
}