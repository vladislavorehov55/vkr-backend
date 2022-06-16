const {Router} = require('express');
const User = require('../models/User');
const Car = require('../models/Car');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth.middleware');

const adminRouter = Router();

adminRouter.get('/get-car/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    const car = await Car.findOne({_id: id});
    return res.json({car});
  }
  catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже'})
  }
})

adminRouter.post('/update-car', auth, async (req, res) => {
  const {id, ...inputs} = req.body;
  try {
    await Car.updateOne({_id: id}, inputs);
    return res.json({message: 'Данные машины изменены'})
  }
  catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже'})
  }
})

adminRouter.get('/get-users', auth, async (req, res) => {
  try {
    const users = await User.find({role: {$ne: 'client'}});
    return res.json({users});
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже'})
  }

})
adminRouter.post('/add-user', auth, async (req, res) => {
  const {login, password, role} = req.body;
  const candidate = await User.findOne({login});
  if (candidate) {
    return res.status(400).json({message: 'Такой пользователь уже существует'});
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await new User({login, password: hashedPassword, role});
  await user.save();
  if (role === 'driver') {
    const cars = await Car.find({driverID: '-'});
    if (cars[0]) {
      await Car.updateOne({_id: cars[0]._id}, {driverID: user._id});
    }
  }
  return res.json({message: 'Пользователь зарегистрирован', user: req.body})
})
adminRouter.post('/delete-user', auth, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({_id: req.body.id});
    if (user.role === 'driver') {
      await Car.updateOne({driverID: req.body.id}, {driverID: '-'});
    }
    const users = await User.find({role: {$ne: 'client'}});
    return res.json({users, message: 'Пользователь успешно удален'})
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже'});
  }

})

adminRouter.post('/add-car', auth, async (req, res) => {
  let car;
  try {
    const cars = await Car.find();
    const drivers = await User.find({role: 'driver'});
    if (cars[0] === false) {
      if (drivers[0]) {
        car = await new Car({driverID: drivers[0]._id, ...req.body});
      } else {
        car = await new Car({driverID: '-', ...req.body});
      }
    } else {
      if (drivers[0] === false) {
        car = await new Car({driverID: '-', ...req.body});
      } else {
        const workersIDs = [];
        for (let item of cars) {
          workersIDs.push(item.driverID);
        }
        const drivers = await User.find({role: 'driver', _id: {$nin: [...workersIDs]}});
        if (drivers[0]) {
          car = await new Car({driverID: drivers[0]._id, ...req.body});
        } else {
          car = await new Car({driverID: '-', ...req.body})
        }
      }
    }
    await car.save();
    return res.json({message: 'Машина успешно добавлена'})
  } catch (e) {
    return res.status(500).json({message: 'Извинет, что-то пошло не так. Машина не добавилась'})
  }
})
adminRouter.get('/get-cars', auth, async (req, res) => {
  try {
    const cars = await Car.find({});
    return res.json({cars});
  } catch (e) {
    return res.status(500).json({message: 'Извините что-то пошло не так, повторите попытку позже'})
  }
})
adminRouter.post('/delete-car', auth, async (req, res) => {
  try {
    await Car.remove({_id: req.body.id});
    const cars = await Car.find({});
    return res.json({cars, message: 'Машина успешно удалена'})
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так'})
  }

})

module.exports = adminRouter