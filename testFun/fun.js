function generateNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

const CreateGroupsPoints = require('../GA/CreateGroupsPointsGA');
const CreateRouteGA = require("../GA/CreateRouteGA");
const routesDistanceMatrixSecond =
  [
    [28, 79, 13, 6, 81, 78],
    [56, 27, 23, 46, 83, 92],
    [25, 53, 74, 78, 44, 65],
    [99, 48, 8, 97, 84, 29],
    [5, 24, 11, 69, 58, 76],
    [58, 84, 50, 83, 45, 93]
  ]
routesDistanceMatrixFirst = [
  [27, 23, 46, 83, 92],
  [53, 74, 78, 44, 65],
  [48, 8, 97, 84, 29],
  [24, 11, 69, 58, 76],
  [84, 50, 83, 45, 93]
]
const addresses = {
  1: generateNumber(1, 51),
  2: generateNumber(1, 51),
  3: generateNumber(1, 51),
  4: generateNumber(1, 51),
  5: generateNumber(1, 51)
}
console.log('addresses', addresses)
const groupsPoints = new CreateGroupsPoints(routesDistanceMatrixFirst, 2).execute();
console.log('groupsPoints', groupsPoints)
const routes = []
for (let groupPoints of groupsPoints) {
  const distanceMatrix = {0: getDistancesByInd(0, groupPoints, routesDistanceMatrixSecond)};
  const shippingWeight = {};
  for (let point of groupPoints) {
    shippingWeight[point + 1] = addresses[point + 1];
    distanceMatrix[point + 1] = getDistancesByInd(point + 1, groupPoints, routesDistanceMatrixSecond);
  }

  let createdRoute = new CreateRouteGA(Object.values(distanceMatrix), shippingWeight, 5, 31.5, 'бензин', 5, 1000).execute();
  createdRoute = createdRoute.slice(1, createdRoute.length - 1);
  const routeAddresses = [];
  for (let item of createdRoute) {
    routeAddresses.push(addresses[Object.keys(distanceMatrix)[item]]);
  }
  routes.push(createdRoute)
}

function getDistancesByInd(addressInd, groupPoints, routesDistanceMatrix) {
  const res = [-1, ...groupPoints].sort(); /// [-1, 1, 0]
  return res.map(point => {
    return routesDistanceMatrix[addressInd][point + 1]
  })
}

console.log('routes', routes)