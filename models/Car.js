const {Schema, model} = require('mongoose');
const schema = new Schema({
    driverID: {type: String, required: true},
    model: {type: String, required: true},
    standardFuelConsumption: {type: Number, required: true},
    maxWeightInCar: {type: Number, required: true},
    age: {type: Number, required: true},
    mileage: {type: Number, required: true},
    fuelType: {type: String, required: true}
});

module.exports = model('Car', schema);