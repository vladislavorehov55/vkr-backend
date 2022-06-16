const {Schema, model} = require('mongoose');

const schema = new Schema({
    bidID: {type: String, required: true},
    productName: {type: Array, of: String, required: true},
    address: {type: String, required: true},
    weight: {type: Number, required: true},
    status: {type: String, required: true},
    distances: {type: Array, of: Number, required: true}
})

module.exports = model('Address', schema);