import {
    AxiosResponse as AxiosResponse
} from 'axios';

import { update as update } from './api.ts';

const errors: String[] = [];
function logErrors(p: Promise<AxiosResponse<any, any>>) {
}

async function RUN() {
    try {
        await Promise.all([
            update('192.168.9.11', 60, 280),
            update('192.168.9.12', 60, 280),
            update('192.168.9.13', 60, 280),
            update('192.168.9.14', 60, 280)
        ])
    } catch (e) {
        console.log(e)
    }
}
RUN();