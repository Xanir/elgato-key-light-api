import {
    AxiosResponse as AxiosResponse,
    AxiosError as AxiosError,
    AxiosRequestConfig as AxiosRequestConfig,
    default as axios
} from 'axios';

export interface ElgatoLight {
    on: number,
    brightness: number,
    temperature: number,
}

export interface ElgatoDevice {
    productName: String,
    hardwareBoardType: Number,
    firmwareBuildNumber: Number,
    firmwareVersion: String,
    serialNumber: String,
    displayName: String,
    features: String[]
}

const requestTimeout: number = 100;
const requestConfig: AxiosRequestConfig =
{
    timeout: requestTimeout,
    headers: {
        'Content-Type': 'application/json',
    }
};

function setLightFn(ip: String, brightness: number, color: number): Promise<ElgatoLight> {
    return new Promise(async (resolve, reject) => {
        try {
            const dataPromise: Promise<AxiosResponse<any, any>> = axios.put(`
                http://${ip}:9123/elgato/lights`,
                /* data */
                {
                    "numberOfLights": 1,
                    "lights": [
                        {
                            "on": 1,
                            "brightness": brightness,
                            "temperature": color
                        }
                    ]
                },
                /* config */
                requestConfig
            );
            const response: AxiosResponse<any, any> = await dataPromise;
            const elgatoLightValues: ElgatoLight = response.data.lights[0];

            resolve(elgatoLightValues);
        } catch(e) {
            reject(`Update to ${ip} failed`);
        }
    });
}

function getLightFn(ip: String): Promise<ElgatoLight> {
    return new Promise(async (resolve, reject) => {
        try {
            const dataPromise: Promise<AxiosResponse<ElgatoLight, any>> = axios.get(`
                http://${ip}:9123/elgato/lights`,
                /* config */
                requestConfig
            );
            const response: AxiosResponse<any, any> = await dataPromise;
            const elgatoLightValues: ElgatoLight = response.data.lights[0];

            resolve(elgatoLightValues);
        } catch(e) {
            reject(`Update to ${ip} failed`);
        }
    });
}

function getInfoFn(ip: String): Promise<ElgatoDevice> {
    return new Promise(async (resolve, reject) => {
        try {
            const dataPromise: Promise<AxiosResponse<any, any>> = axios.get(`
                http://${ip}:9123/elgato/accessory-info`,
                /* config */
                requestConfig
            );
            const response: AxiosResponse<any, any> = await dataPromise;
            const elgatoLightValues: ElgatoDevice = response.data;

            resolve(elgatoLightValues);
        } catch(e) {
            reject(`Update to ${ip} failed`);
        }
    });
}

export const setLight = setLightFn
export const getLight = getLightFn
export const getInfo = getInfoFn
