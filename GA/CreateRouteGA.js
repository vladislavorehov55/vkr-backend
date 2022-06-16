const GA = require('./GA');

class CreateRouteGA extends GA {
    constructor(distanceMatrix, shippingWeight, maxWeightInCar, Hsan, fuelType, age, mileage) {
        super();
        this.distanceMatrix = distanceMatrix;
        this.shippingWeight = shippingWeight;
        this.maxWeightInCar = maxWeightInCar;
        this.Hsan = Hsan;
        this.Hw = this.getHw(fuelType);
        this.D = this.getD(mileage, age);
        this.startPointPath = 0;
    }
    getHw(fuelType) {
        if (fuelType.toLowerCase() === 'бензин') {
            return 2
        }
        else {
            return 1.3
        }
    }
    getD(mileage, age) {
        if (age <= 8 && mileage <= 150000) {
            return 5
        }
        else if (age > 8 && mileage > 150000) {
            return 10
        }
    }


    calculateFuelConsumption(Hsan, S, Hw, cargoWeight, mileageWithLoad, D) {
        return 0.01 * (Hsan * S + Hw * cargoWeight * mileageWithLoad) * (1 + 0.01 * D)
    }

    generatePopulation(populationSize) {
        const populationArray = [];
        for (let i =0; i < populationSize; i++) {
            const chromosomeArray = [];
            // Генерируем такие точки маршрута, которых еще нет и которые не являются точкой отправления
            while (chromosomeArray.length !== this.distanceMatrix.length - 1) {
                const newPathPoint = super.generateNumber(1, this.distanceMatrix.length);
                if (!chromosomeArray.includes(newPathPoint)) {
                    chromosomeArray.push(newPathPoint)
                }
            }
            // добавляем хромосому в популяцию, но в хромосоме первая и последняя точка - точка
            // отправления
            populationArray.push([this.startPointPath, ...chromosomeArray, this.startPointPath]);
        }
        return populationArray
    }

    callFitness(distanceMatrix,population, maxWeightInCar, shippingWeight, Hsan, Hw, D) {
        return population.map(chromosome => {
            let weightInCar = maxWeightInCar;
            const shippingWeightCopy = {...shippingWeight};
            const chromosomeCopy = [...chromosome];
            let fuelConsumption = 0;
            // Расчет расхода топлива
            let isReturnToDepo = false;
            for (let i = 0; i < chromosomeCopy.length - 1; i++) {
                let firstPoint = isReturnToDepo ? 0 : chromosomeCopy[i];
                const secondPoint = chromosomeCopy[i + 1];
                // Если грузоподъемность больше веса доставки
                if (weightInCar > shippingWeightCopy[secondPoint]) {
                    fuelConsumption += this.calculateFuelConsumption(Hsan, distanceMatrix[firstPoint][secondPoint], Hw, weightInCar, distanceMatrix[firstPoint][secondPoint], D)
                    // Когда в едет в последнюю точку
                    if (i + 1 === chromosomeCopy.length) {
                        fuelConsumption += this.calculateFuelConsumption(Hsan, distanceMatrix[secondPoint][0], Hw, 0, distanceMatrix[secondPoint][0], D)
                    }
                    isReturnToDepo = false;
                    weightInCar -= shippingWeightCopy[secondPoint];
                }
                else {
                    while (weightInCar <= shippingWeightCopy[secondPoint]) {
                        fuelConsumption += this.calculateFuelConsumption(Hsan, distanceMatrix[firstPoint][secondPoint], Hw, weightInCar, distanceMatrix[firstPoint][secondPoint], D);
                        fuelConsumption += this.calculateFuelConsumption(Hsan, distanceMatrix[secondPoint][0], Hw, 0, distanceMatrix[secondPoint][0], D);
                        isReturnToDepo = true;
                        shippingWeightCopy[secondPoint] -= weightInCar;
                        weightInCar = maxWeightInCar;
                        firstPoint = 0;
                    }
                }
            }
            return +fuelConsumption.toFixed(2)
        })
    }

    crossover(parents) {
        const offspring = [];
        // Последовательно скрещиваем всех особей, которых отобрали
        for (let k = 0; k < parents.length; k++) {
            // Выбираем двух особей, но без первого и последнего гена (отвечают за начальную и конечную точку, они не меняются)
            const parentOne = parents[k].slice(1, parents[k].length - 1);
            const parentTwo = k + 1 > parents.length - 1 ? parents[0].slice(1, parents[0].length - 1) : parents[k + 1].slice(1, parents[k + 1].length - 1);


            // Создаем точки разрыва для скрещивания. Они не могут быть первым и последним генами, равняться друг другу
            let breakPointsArray = []; // [1, 2, 3, ...]
            for (let w = 1; w < parentOne.length - 1; w++) {
                breakPointsArray.push(w);
            }


            let breakPointOne = null;
            let breakPointTwo = null;
            if (parentOne.length === 2) {
                breakPointOne = 0;
                breakPointTwo = 0;
            }
            else if (parentOne.length === 3) {
                breakPointOne = 1;
                breakPointTwo = 1;
            }
            else {
                const breakPointOneInd = super.generateNumber(0, breakPointsArray.length);
                breakPointOne = breakPointsArray[breakPointOneInd];
                breakPointsArray = [...breakPointsArray.slice(0, breakPointOneInd), ...breakPointsArray.slice(breakPointOneInd + 1)];
                breakPointTwo = breakPointsArray[super.generateNumber(0, breakPointsArray.length)];
            }

            const [breakPointStart, breakPointEnd] = [breakPointOne, breakPointTwo].sort();

            // использую упорядоченное скрещивание. Фрагменты между точками разрыва меняются местами.
            // Далее прохордим все гены первого родителя, начиная от второй точки разрыва, и добавляем гены,
            // если они еще не  существуют в хромосоме первого потомка. То же самое для второго родителя
            const parentOneFrag = parentOne.slice(breakPointStart, breakPointEnd + 1);
            const parentTwoFrag = parentTwo.slice(breakPointStart, breakPointEnd + 1);
            for (let parent of [[parentOne, parentTwoFrag], [parentTwo, parentOneFrag]]) {
                let offspringItem = [];
                for (let j = breakPointEnd + 1; j < breakPointEnd + 1 + (parent[0].length - parent[1].length); j++) {
                    let ind = j <= parent[0].length - 1 ? j : j % parent[0].length;
                    const gene = parent[0][ind];
                    if (offspringItem.includes(gene) || parent[1].includes(gene)) {
                        while (offspringItem.includes(parent[0][ind]) || parent[1].includes(parent[0][ind])) {
                            ind = ind + 1 <= parent[0].length - 1 ? ind + 1 : 0;
                        }
                    }
                    /// Так как мы осуществляем обход генов с конца и затем переходим в начало, то необходимо гены с конца
                    /// помещать в конец и наоборот
                    if (j <= parent[0].length - 1) {
                        offspringItem.push(parent[0][ind])
                    }
                    else {
                        offspringItem.unshift(parent[0][ind])
                    }
                }
                offspringItem = [...offspringItem.slice(0, breakPointStart).reverse(), ...parent[1], ...offspringItem.slice(breakPointStart)];
                offspring.push([this.startPointPath, ...offspringItem, this.startPointPath]);
            }
        }
        return [...offspring, ...parents]
    }

    execute() {
        const generationCount = 10;
        let newPopulation = this.generatePopulation(60);
        for (let i = 0; i < generationCount; i++) {
            const fitnessValues = this.callFitness(this.distanceMatrix,newPopulation, this.maxWeightInCar, this.shippingWeight, this.Hsan, this.Hw, this.D);
            const selectedParents = super.selectParents(newPopulation, fitnessValues, 10);
            const offspring = this.crossover(selectedParents);
            newPopulation = super.mutation(offspring, 1, offspring[0].length - 1);
        }
        const fitnessValues = this.callFitness(this.distanceMatrix,newPopulation, this.maxWeightInCar, this.shippingWeight, this.Hsan, this.Hw, this.D);
        const [bestSolution] = super.selectParents(newPopulation, fitnessValues, 1);
        return bestSolution
    }
}
// const distanceMatrix = [
//     [0,4,6,2,9],
//     [4,0,3,2,9],
//     [6,3,0,5,9],
//     [2,2,5,0,8],
//     [9,9,9,8,0]
// ];
// const shippingWeight = {1: 1, 2: 3, 3: 3, 4: 4};
// const a = new CreateRouteGA(distanceMatrix, shippingWeight, 5, 31.5, 'бензин', 5, 1000);
// a.execute()

module.exports = CreateRouteGA