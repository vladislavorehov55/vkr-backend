const {Router} = require('express');
const Bid = require('../models/Bid');
const Address = require('../models/Address')
const config = require("config");
const auth = require('../middleware/auth.middleware');
const clientRouter = Router();

clientRouter.post('/add-bid', auth,  async (req, res) => {
    const warehouseAddress = await Address.find({address: config.get('warehouseAddress')});
    if (!warehouseAddress[0]) {
        await Address.insertMany({address: config.get('warehouseAddress'), weight: 0, status: 'новый', distances: [], productName: '-', bidID: '-'});
    }
    const {userID, addresses, weight, productsNames} = req.body;
    try {
        const bid = await new Bid({
            clientID: userID,
            addresses: Object.values(addresses),
            weight: Object.values(weight),
            productsNames: Object.values(productsNames)
        });
        await bid.save();
        const data = {};
        const addressesArray = Object.values(addresses);
        const weightArray = Object.values(weight)
        const productsNamesArray = Object.values(productsNames);
        for (let i = 0; i < productsNamesArray.length; i++) {
            const address = addressesArray[i];
            if (data[address] === undefined) {
                data[address] = {
                    bidID: bid._id,
                    productName: [productsNamesArray[i]],
                    address,
                    weight: Number(weightArray[i]),
                    status: 'новый',
                    distances: []
                }
            }
            else {
                data[address].productName.push(productsNamesArray[i]);
                data[address].weight = data[address].weight + Number(weightArray[i]);
            }
        }
        await Address.insertMany(Object.values(data))
        return res.json({message: 'Заявка успешно добавлена'})
    } catch (e) {
        console.log('Eroor', e)
        return res.status(500).json({message: 'Извините, что-то пошло не так. Ваша заявка не добавлена. Повторите попытку позже'})
    }
})

clientRouter.post('/my-bids', auth,async (req, res) => {
    try {
        const bids = await Bid.find({clientID: req.body.userID});
        return res.json({bids})
    }
    catch (e) {
        return res.status(500).json({message: 'Извините что-то пошло не так. Попробуйте позже'})
    }
})
clientRouter.get('/bid/:id', auth, async (req, res) => {
    try {
        const bid = (await Bid.find({_id: req.params.id}))[0];
        const addresses = {};
        const weight = {};
        const productsNames = {};
        bid.addresses.forEach((item, ind) => {
            addresses[`address${ind + 1}`] = item;
            weight[`weight${ind + 1}`] = bid.weight[ind];
            productsNames[`productName${ind + 1}`] = bid.productsNames[ind];
        })
        return res.json({addresses, weight, productsNames})
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({message: 'Извините что-то пошло не так. Попробуйте позже'})
    }
})
clientRouter.post('/edit-bid', auth, async (req, res) => {
    const {bidID, userID, productsNames, addresses, weight} = req.body;
    try {
        // const bid = (await Bid.find({_id: bidID}))[0];
        await Bid.updateOne({_id: bidID}, {
            clientID: userID,
            productsNames: Object.values(productsNames),
            addresses: Object.values(addresses),
            weight: Object.values(weight)
        })
        await Address.deleteMany({bidID});
        const data = [];
        const addressesArray = Object.values(addresses);
        for (let i = 0; i < addressesArray.length; i++) {
            const address = {
                bidID,
                productName: Object.values(productsNames)[i],
                address: addressesArray[i],
                weight: Object.values(weight)[i],
                status: 'новый',
                distances: []
            }
            data.push(address)
        }
        await Address.insertMany(data);
        return res.json({message: 'Заявка успешно отредактирована'})

    }
    catch (e) {
        console.log(e)
        return res.status(500).json({message: 'Извините что-то пошло не так. Попробуйте позже'})
    }
})
clientRouter.delete('/bid', auth,async (req, res) => {
    const {id} = req.body;
    try{
        await Bid.deleteOne({_id: id});
        await Address.deleteMany({bidID: id});
        return res.json({message: 'Заявка удалена'})
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({message: 'Извините что-то пошло не так. Попробуйте позже'})
    }
})
module.exports = clientRouter