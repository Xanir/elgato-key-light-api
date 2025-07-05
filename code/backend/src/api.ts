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
    ip: String,
    hardwareBoardType: Number,
    firmwareBuildNumber: Number,
    firmwareVersion: String,
    serialNumber: String,
    displayName: String,
    features: String[]
}

const requestConfig: AxiosRequestConfig =
{
    timeout: 100,
    headers: {
        'Content-Type': 'application/json',
    }
};

async function setLightFn(ip: String, brightness: number, color: number): Promise<ElgatoLight> {
    const validationErrors: String[] = [];
    if (brightness < 0 && brightness > 100) {
        validationErrors.push(`parameter 'brightness' must be between 0 && 100`)
    }
    if (color < 143 && color > 344) {
        validationErrors.push(`parameter 'color' must be between 143 && 344`)
    }
    if (validationErrors.length) {throw validationErrors}

    try {
        const response: AxiosResponse<any, any> | void = await axios.put(`
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
        )

        const elgatoLightValues: ElgatoLight = response?.data?.lights[0];
        return elgatoLightValues;
    } catch (e) {
        throw new Error(`Failed Reuest: Update to ${ip}`)
    }
}

async function getLightFn(ip: String): Promise<ElgatoLight> {
    try {
        const response: AxiosResponse<ElgatoLight, any> | void = await axios.get(`
            http://${ip}:9123/elgato/lights`,
            /* config */
            requestConfig
        );

        const elgatoLightValues: ElgatoLight = response?.data?.lights[0];
        return elgatoLightValues;
    } catch (e) {
        throw new Error(`Failed Reuest: Getting light info for ${ip}`)
    }
}

async function getInfoFn(ip: String): Promise<ElgatoDevice> {
    try {
        const response: AxiosResponse<any, any> | void = await axios.get(`
            http://${ip}:9123/elgato/accessory-info`,
            /* config */
            requestConfig
        );

        const elgatoLightValues: ElgatoDevice = response?.data;
        return elgatoLightValues;
    } catch (e) {
        throw new Error(`Failed Reuest: Getting accessory info for ${ip} failed`)
    }
}

async function setDeviceNameFn(ip: String, name: String): Promise<void | AxiosResponse<any, any>> {
    try {
        const response: void | AxiosResponse<any, any> = await axios.put(`
            http://${ip}:9123/elgato/accessory-info`,
            /* data */
            {
                "displayName": name,
            },
            /* config */
            requestConfig
        )

        return response;
    } catch (e) {
        throw new Error(`Failed Reuest: Setting device name for ${ip}`)
    }
}

export const setLight = setLightFn
export const getLight = getLightFn
export const getInfo = getInfoFn
export const setDeviceName = setDeviceNameFn
