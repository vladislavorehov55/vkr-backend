const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({message: 'Время авторизации истекло. Осуществите вход в систему заново'});
        }
        req.user = jwt.verify(token, config.get('secretKey'));
        next()
    }
    catch (e) {
        res.status(401).json({ message: 'Время авторизации истекло. Осуществите вход в систему заново'});
    }

}