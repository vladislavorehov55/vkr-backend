const {Router} = require('express');
const Route = require('../models/Route');
const Address = require('../models/Address');
const config = require('config');
const auth = require('../middleware/auth.middleware')
const driverRouter = Router();

driverRouter.post('/', auth, async (req, res) => {
  const {driverID} = req.body;
  try {
    const route = (await Route.find({driverID}))[0];
    if (!route) {
      return res.json();
    }
    return res.json({route: route.addresses, error: false})
  }
  catch (e) {
    console.log('Error', e)
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже', error: true})
  }
})
driverRouter.post('/goods', auth, async (req, res) => {
  const {address} = req.body;
  try {
    const goods = (await Address.find({address}))[0].productName;
    return res.json({goods})
  }
  catch (e) {
    console.log(e);
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже'})
  }
})
driverRouter.post('/complete-route', auth, async (req, res) => {
  const {driverID, routeAddresses} = req.body;
  try {
    await Route.deleteOne({driverID});
    await Address.deleteMany({address: {$in: [...routeAddresses, config.get('warehouseAddress')]}});
    return res.json({message: 'Маршрут завершен', error: false})
  }
  catch (e) {
    console.log(e);
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже', error: true})
  }

})
module.exports = driverRouter;