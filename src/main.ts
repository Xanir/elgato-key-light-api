import {default as fs} from 'fs';

import {
    setLight as setLight
} from './api.ts';

const filePath = process.argv[2]; // Get file path from command-line argument

interface ElgatoLightValues {
    ip: string,
    brightness: number,
    color: number,
}

async function RUN() {
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
RUN();
