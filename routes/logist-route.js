const {Router} = require('express');
const Address = require('../models/Address');
const Bid = require('../models/Bid');
const Car = require('../models/Car');
const Route = require('../models/Route');
const CreateGroupsPointsGA = require('../GA/CreateGroupsPointsGA');
const CreateRouteGA = require('../GA/CreateRouteGA');
const auth = require('../middleware/auth.middleware')
const logistRouter = Router();

logistRouter.get('/address-check/:id', auth, async (req, res) => {
  const address = await Address.findOne({_id: req.params.id, status: 'в обработке'});
  if (address) {
    await Address.updateOne({_id: req.params.id}, {status: 'новый'})
    return res.json({message: 'Вы не обработали адрес'});
  }
})

logistRouter.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({status: 'новый'});
    if (!addresses[0]) {
      return res.json({data: [], error: false});
    }
    const countAddresses = Number(await Address.countDocuments({}));
    const countCars = Number(await Car.countDocuments({driverID: {$ne: '-'}}));

    /// Если кол-во точек, которое надо посетить, равно 1 и кол-во водителей равно или больше 1, то рандомно выбираем водителя
    if (countAddresses - 1 === 1 && Number(countCars) >= 1) {
      console.log(1)
      let indArray = [];
      for (let i = 0; i < countCars; i++) {
        indArray.push(i);
      }
      await Bid.deleteMany({_id: addresses[1].bidID});
      await Address.updateMany({}, {status: 'обработан'});
      const cars = await Car.find({driverID: {$ne: '-'}});
      const ind = Math.floor(Math.random() * countCars);
      await Route.insertMany({driverID: cars[indArray[ind]].driverID, addresses: addresses[1].address});
      return res.json({data: [], error: false})
    }
    /// Если количество точек меньше, чем водителей, то распределяем их рандомно между водителями
    if (countAddresses - 1 < countCars) {
      console.log('2')
      const cars = await Car.find({driverID: {$ne: '-'}});
      let indArray = [];
      const routes = [];
      for (let i = 0; i < countCars; i++) {
        indArray.push(i);
      }
      for (let i = 1; i < countAddresses; i++) {
        const ind = Math.floor(Math.random() * indArray.length);
        routes.push({driverID: cars[indArray[ind]].driverID, addresses: addresses[i].address});
        indArray = [...indArray.slice(0, ind), ...indArray.slice(ind + 1)];
      }
      await Bid.deleteMany({_id: addresses[1].bidID});
      await Route.insertMany(routes);
      await Address.updateMany({}, {status: 'обработан'});
      return res.json({data: [], error: false});
    }
    /// Если количество точек, которые надо посетить равно кол-ву водителей и не равно 1,
    /// то рандомно распределяем их между водителями
    if (countAddresses - 1 === countCars) {
      console.log(3)
      const cars = await Car.find({driverID: {$ne: '-'}});
      let indArray = [];
      for (let i = 1; i <= countCars; i++) { // с 1 так как 0 элемент - склад
        indArray.push(i);
      }
      const routes = []
      for (let car of cars) {
        const ind = Math.floor(Math.random() * indArray.length);
        routes.push({driverID: car.driverID, addresses: addresses[indArray[ind]].address});
        indArray = [...indArray.slice(0, ind), ...indArray.slice(ind + 1)];
      }
      await Bid.deleteMany({_id: addresses[1].bidID});
      await Address.updateMany({}, {status: 'обработан'});
      await Route.insertMany(routes);
      return res.json({data: [], error: false});
    }

    const addressesNameArray = [];
    for (let address of addresses) {
      addressesNameArray.push({id: address._id, address: address.address});
    }
    return res.json({data: addressesNameArray, error: false})
  } catch (e) {
    console.log(e)
    return res.status(500).json({message: 'Извините что-то пошло не так. Попробуйте позже', error: true})
  }

})
logistRouter.get('/address/:id', auth, async (req, res) => {
  try {
    const {id} = req.params;
    const address = await Address.find({_id: id});
    const addresses = await Address.find({});
    const addressesNameArray = [];
    for (let address of addresses) {
      addressesNameArray.push(address.address)
    }
    await Address.updateOne({_id: id}, {status: 'в обработке'})
    return res.json({address: address[0].address, addresses: addressesNameArray})
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так'})
  }
})

logistRouter.post('/address-save/:id', auth, async (req, res) => {
  const distances = [];
  Object.values(req.body).forEach((item) => {
    if (item === '') {
      distances.push(99999999999999999999);
      return
    }
    distances.push(item);
  })
  await Address.updateOne({_id: req.params.id}, {status: 'обработан', distances});
  let addresses = await Address.find({status: {$in: ['в обработке', 'новый']}});
  if (addresses[0]) {
    await Bid.deleteMany({_id: addresses[0].bidID});
    return res.json({message: 'Матрица расстояний сохранена, но есть необработанные маршруты'});
  }
  /// Выполняем эту часть только если все заявки обработаны
  const countCars = await Car.countDocuments({driverID: {$ne: '-'}});
  addresses = await Address.find({});

  let routesDistanceMatrixFirst = []; // Матрица расстояния для алгоритма группировки (без точки-склада)
  const routesDistanceMatrixSecond = []; // матрица расстояний для алгоритма построения маршрута
  for (let address of addresses) {
    routesDistanceMatrixFirst.push(address.distances.slice(1));
    routesDistanceMatrixSecond.push(address.distances);
  }
  routesDistanceMatrixFirst = routesDistanceMatrixFirst.slice(1);
  const cars = await Car.find({driverID: {$ne: '-'}});

  /// Если водитель 1, а точек много, то отдаем все точки ему и запускаем алгоритм построения маршрута
  if (Number(countCars) === 1) {
    // const [car] = await Car.find({driverID: drivers[0]._id});
    const shippingWeight = {};
    for (let i = 0; i < routesDistanceMatrixFirst.length; i++) {
      shippingWeight[i + 1] = addresses[i + 1].weight;
    }
    const createdRoute = new CreateRouteGA(routesDistanceMatrixSecond, shippingWeight, cars[0].maxWeightInCar, cars[0].standardFuelConsumption, cars[0].fuelType, cars[0].age, cars[0].mileage).execute();
    const routeAddresses = [];
    for (let item of createdRoute) {
      routeAddresses.push(addresses[item].address);
    }
    console.log('Ma')
    await Route.insertMany({driverID: cars[0].driverID, addresses: routeAddresses.slice(1, routeAddresses.length - 1)});
    // await Bid.deleteMany({_id: addresses[1].bidID});
    return res.json({message: 'Маршруты построены'});
  }
  if (routesDistanceMatrixFirst.length > Number(countCars)) {
    let indArray = [];
    for (let i = 0; i < countCars; i++) {
      indArray.push(i);
    }
    const groupsPoints = new CreateGroupsPointsGA(routesDistanceMatrixFirst, countCars).execute();
    const routes = [];
    for (let groupPoints of groupsPoints) {
      const ind = Math.floor(Math.random() * indArray.length);
      if (groupPoints.length === 1) {
        routes.push({driverID: cars[indArray[ind]].driverID, addresses: addresses[groupPoints[0] + 1].address})
        indArray = [...indArray.slice(0, ind), ...indArray.slice(ind + 1)]
      } else {
        const distanceMatrix = {0: getDistancesByInd(0, groupPoints, routesDistanceMatrixSecond)};
        const shippingWeight = {};
        for (let point of groupPoints) {
          shippingWeight[point + 1] = addresses[point + 1].weight;
          distanceMatrix[point + 1] = getDistancesByInd(point + 1, groupPoints, routesDistanceMatrixSecond);
        }
        // const [car] = await Car.findOne({driverID: cars[indArray[ind]]._id});
        const car = cars[indArray[ind]];
        let createdRoute = new CreateRouteGA(Object.values(distanceMatrix), shippingWeight, car.maxWeightInCar, car.standardFuelConsumption, car.fuelType, car.age, car.mileage).execute();
        createdRoute = createdRoute.slice(1, createdRoute.length - 1);
        const routeAddresses = [];
        for (let item of createdRoute) {
          routeAddresses.push(addresses[Object.keys(distanceMatrix)[item]].address);
        }
        routes.push({diverID: cars[indArray[ind]].driverID, addresses: routeAddresses})
        indArray = [...indArray.slice(0, ind), ...indArray.slice(ind + 1)]
      }
    }
    await Route.insertMany(routes);
    // await Bid.deleteMany({_id: addresses[1].bidID});
  }
  return res.json({message: 'Маршруты построены'})

})

const getDistancesByInd = (addressInd, groupPoints, routesDistanceMatrix) => {
  const res = [-1, ...groupPoints].sort(); /// [-1, 1, 0]
  return res.map(point => {
    return routesDistanceMatrix[addressInd][point + 1]
  })
}
module.exports = logistRouter;