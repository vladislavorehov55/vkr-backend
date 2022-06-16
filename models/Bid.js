const {Schema, model} = require('mongoose');

const schema = new Schema({
    clientID: {type: String, required: true},
    productsNames: {type: Array, of: String, required: true},
    addresses: {type: Array, of: String, required: true},
    weight: {type: Array, of: Number, required: true}
})

module.exports = model('Bid', schema);