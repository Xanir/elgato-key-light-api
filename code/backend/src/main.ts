import {default as fs} from 'fs';
import {default as express} from 'express';
import {
    getLightsOnNetwork as getLightsOnNetwork,
} from './scanForLights.ts';
import {
    ElgatoLight as ElgatoLight,
    ElgatoDevice as ElgatoDevice,
    setDeviceName as setDeviceName,
    setLight as setLight
} from './api.ts';

let activeLights: ElgatoDevice[] = [];
async function scanAndUpdateCache() {
    try {
        const lights: String[] = await getLightsOnNetwork();
        activeLights = lights.map(ip => {ip: ip});
    } catch (e) {
        console.log(e)
    }
}

const app = express();
app.use(express.json());

app.get('/force', async (req, res) => {
    let appReturn;
    try {
        await scanAndUpdateCache();
        res.send(activeLights.map(l => l.ip));
    } catch (e) {
        console.log(e)
    }

    res.send(appReturn);
});

app.get('/', async (req, res) => {
    res.send(activeLights.map(l => l.ip));
});

app.put('/', async (req, res) => {
    try {
        const data: ElgatoLight = req.body;
        for (const light of activeLights) {
            await setLight(light.ip, data.brightness, data.temperature)
        }
        res.send();
    } catch (e) {
        res.status(422).send(e);
    }
});

app.listen(8080, () => {
    console.log(`Server is listening`);
});

async function start() {
    await scanAndUpdateCache();
    console.log(activeLights)
}
start()

async function testNameUpdate() {
    try {
        const r = await setDeviceName('192.168.9.12', 'myLight');
        console.log(r)
    } catch (e) {
        console.log(e)
    }
}
