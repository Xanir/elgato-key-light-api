import {default as fs} from 'fs';
import express from 'express';

import services from './servicesRouter';

const app = express();
app.use(express.json());

app.use('/api', services)

app.use(express.static('dist/web'))

app.listen(8080, () => {
    console.log(`Server is listening`);
});