const {Schema, model} = require('mongoose');

const schema = new Schema({
    FIO: {type: String},
    login: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, required: true},
});

module.exports = model('User', schema);