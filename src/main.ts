import {default as fs} from 'fs';

import {
    getLightsOnNetwork as getLightsOnNetwork,
} from './scanForLights.ts';
import {
    setDeviceName as setDeviceName,
    setLight as setLight
} from './api.ts';

const filePath = process.argv[2]; // Get file path from command-line argument

interface ElgatoLightValues {
    ip: string,
    brightness: number,
    color: number,
}

async function updateLights() {
    try {
        if (filePath) {
            try {
                const data: string = fs.readFileSync(filePath, 'utf8');
                const updateData: Array<ElgatoLightValues> = JSON.parse(data);
                const updates = updateData.map((values) => {
                    return setLight(values.ip, values.brightness, values.color)
                })

                await Promise.all(updates)
            } catch (e) {
                console.log(`Failed to load file: ${filePath}`);
            }
        } else {
            console.log('Please provide a file path as an argument.');
        }

    } catch (e) {
        console.log(e)
    }
}
updateLights();

async function testScan() {
    try {
        const lights = await getLightsOnNetwork();
        console.log(lights)
    } catch (e) {
        console.log(e)
    }
}
//testScan();


async function testNameUpdate() {
    try {
        const r = await setDeviceName('192.168.9.12', 'nzLight Room');
        console.log(r)
    } catch (e) {
        console.log(e)
    }
}
//testNameUpdate()