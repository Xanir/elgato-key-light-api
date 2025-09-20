import express from 'express';

import {
    getLightsOnNetwork as getLightsOnNetwork,
} from './scanForLights.ts';
import {
    ElgatoLight as ElgatoLight,
    ElgatoDevice as ElgatoDevice,
    setLight as setLight
} from './api.ts';

import {
    getLights as getLights,
    getDevicesInGroup as getDevicesInGroup,
    addDeviceToGroup as addDeviceToGroup,
    updateActiveDevices as updateActiveDevices
} from './deviceManager.ts'

async function scanAndUpdateCache() {
    try {
        const deviceIPs = await getLightsOnNetwork();
        await updateActiveDevices(deviceIPs);
    } catch (e) {
        console.error(e)
    }
}

const servicesRouter: express.Router = express.Router()

servicesRouter.post('/force', async (req, res) => {
    try {
        await scanAndUpdateCache();
        res.send(getLights());
    } catch (e) {
        res.status(500).send();
        console.error(e)
    }

    res.send();
});

servicesRouter.put('/light', async (req, res) => {
    try {
        const data: ElgatoLight = req.body.light;
        if (!data) {
            res.status(422).send();
            return
        }

        let lights: ElgatoDevice[] | null = null;
        if (req.body.group) {
            lights = getDevicesInGroup(req.body.group)
        }
        if (req.body.serialNumber) {
            lights = getLights().filter(light => light.serialNumber === req.body.serialNumber);
        }

        if (!lights) {
            res.status(422).send();
            return
        }

        for (const light of lights) {
            await setLight(light.ip, data.brightness, data.temperature)
        }

        res.send();
    } catch (e) {
        res.status(422).send(e);
    }
});

servicesRouter.put('/group', async (req, res) => {
    try {
        const data = req.body;

        const groupName: String = data.groupName
        const serialNumbers: String[] = data.serialNumbers
        for (const serialNumber of serialNumbers) {
            addDeviceToGroup(groupName, serialNumber)
        }
        
        res.send();
    } catch (e) {
        res.status(422).send(e);
    }
});

export default servicesRouter