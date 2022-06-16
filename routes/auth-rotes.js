const {Router} = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('config');
const User = require('../models/User');
const authRouter = Router();

authRouter.post('/me', async (req, res) => {
  const {jwtToken} = req.body;
  try {
    const decodedToken = jwt.verify(jwtToken, config.get('secretKey'));
    const user = await User.findOne({login: decodedToken.login});
    if (!user) {
      return res.status(404).json({message: 'Пользователь не найден', error: true});
    }
    return res.json({decodedToken, error: false});
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже', error: true})
  }
})
authRouter.post('/signin', async (req, res) => {
  try {
    const {login, password} = req.body;
    const user = await User.findOne({login})
    if (!user) {
      return res.status(404).json({message: 'Пользователь или пароль неверны', error: true})
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      res.status(400).json({message: 'Пользователь или пароль неверны', error: true})
    }
    const token = jwt.sign({userID: user._id, login, role: user.role}, config.get('secretKey'),
      {expiresIn: 60 * 60});
    return res.json({token, login: user.login, role: user.role, userID: user._id, error: false})
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Повторите попытку позже', error: true})
  }

})

authRouter.post('/signup', async (req, res) => {
  const {login, password} = req.body;
  const candidate = await User.findOne({login});
  if (candidate) {
    return res.status(400).json({error: true, message: 'Такой пользователь уже существует'});
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await new User({login: login, password: hashedPassword, role: 'admin'});
  await user.save();
  return res.json({error: false, message: 'Пользователь зарегистрирован'})
})

authRouter.post('/register', async (req, res) => {
  try {
    const {login, password, FIO} = req.body;
    const candidate = await User.findOne({login});
    if (candidate) {
      return res.status(400).json({message: 'Такой пользователь уже существует', error: true});
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const client = await new User({login, password: hashedPassword, role: 'client', FIO});
    await client.save();
    const token = jwt.sign({
      userID: client._id,
      login,
      role: client.role
    }, config.get('secretKey'), {expiresIn: 60 * 60});
    return res.json({
      token,
      login: client.login,
      role: client.role,
      userID: client._id,
      message: 'Вы успешно зарегистрировались',
      error: false
    });
  } catch (e) {
    return res.status(500).json({message: 'Извините, что-то пошло не так. Попробуйте позже', error: true})
  }

})
module.exports = authRouter;