import express from 'express';

import {
    init as initSocketQueries,
    forceQuery as forceQuery
} from './scanForLights.ts';
import {
    ElgatoLight as ElgatoLight,
    ElgatoDevice as ElgatoDevice,
    setLight as setLight
} from './api.ts';

import {
    getLights as getLights,
    getGroups as getGroups,
    getDevicesInGroup as getDevicesInGroup,
    addDeviceToGroup as addDeviceToGroup,
} from './deviceManager.ts'

initSocketQueries();

const servicesRouter: express.Router = express.Router()

servicesRouter.post('/force', async (req, res) => {
    try {
        await forceQuery();
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

servicesRouter.get('/group', async (req, res) => {
    try {
        res.send(getGroups());
    } catch (e) {
        res.status(422).send(e);
    }
});

servicesRouter.get('/group/:id', async (req, res) => {
    const groupId = req.params.id;
    try {

        const devices = getDevicesInGroup(groupId)
        res.send(devices);
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

/*
async function wait(time) {
    await new Promise<void>((resolve, reject) => {
        setTimeout(resolve, time)
    })
}

servicesRouter.put('/scale', async (req, res) => {
    try {
        let lights: ElgatoDevice[] | null = getDevicesInGroup('bedroom')

        console.log(lights)
        const lightValues = [[9, 290], [10, 290], [11, 290], [12, 290], [13, 290], [14, 290], [15, 290], [16, 290], [17, 290]]
        for (const values of lightValues) {
            console.log(values)
            for (const light of lights) {
            console.log(light)
                setLight(light.ip, values[0], values[1])
            }
            await wait(100)
        }

        res.send();
    } catch (e) {
        console.error(e)
        res.status(422).send(e);
    }
});
*/

export default servicesRouter