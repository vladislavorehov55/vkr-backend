const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = config.get("port");

app.use(express.json({extended: true}));
app.use('/api/auth', require('./routes/auth-rotes'));
app.use('/api/client', require('./routes/client-route'));
app.use('/api/logist', require('./routes/logist-route'));
app.use('/api/admin', require('./routes/admin-route'));
app.use('/api/driver', require('./routes/driver-route'));
async function start() {
    try{
        await mongoose.connect(config.get("mongoURI"),{
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, null);
        app.listen(process.env.PORT || PORT, () => console.log(`Сервер начал работу на порту ${PORT}`))
    }catch (e) {
        console.log('Ошибка на сервере', e.message);
        process.exit(1)
    }
}
start();
