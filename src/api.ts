import {
    AxiosResponse as AxiosResponse,
    AxiosError as AxiosError,
    default as axios
} from 'axios';

function updateLight(ip: String, brightness: number, color: number): Promise<AxiosResponse<any, any>> {
    return new Promise(async (resolve, reject) => {
        try {
            const response: Promise<AxiosResponse<any, any>> = axios.put(`
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
                {
                    timeout: 800,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            await response;
            resolve(response);
        } catch(e) {
            reject(`Update to ${ip} failed`);
        }
    });
}

export const update = updateLight