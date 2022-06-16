const {Schema, model} = require('mongoose');

const schema = new Schema({
    driverID: {type: String, required: true},
    addresses: {type: Array, of: String, required: true}
});

module.exports = model('Route', schema);