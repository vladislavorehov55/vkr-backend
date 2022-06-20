
const distanceMatrix = [
    [0,4,6,2,9],
    [4,0,3,2,9],
    [6,3,0,5,9],
    [2,2,5,0,8],
    [9,9,9,8,0]
];
const shippingWeight = {1: 1, 2: 3, 3: 4, 4: 6};
function createRoute(distanceMatrix, shippingWeight, maxWeightInCar = 5.5, Hsan = 31.5, Hw = 2, D = 0) {
    const startPointPath = 0;
    function generatePopulation(populationSize) {
        const populationArray = [];
        for (let i = 0; i < populationSize; i++) {
            const chromosomeArray = [];
            /// Генерируем такие точки маршруты, которых еще нет и которые не будут являться точкой отправления
            while (chromosomeArray.length !== distanceMatrix.length-1) {
                const newPathPoint = Math.floor(Math.random() * (distanceMatrix.length - 0)) + 0;
                if (!chromosomeArray.includes(newPathPoint) && newPathPoint !== startPointPath) {
                    chromosomeArray.push(newPathPoint)
                }
            }
            populationArray.push([startPointPath, ...chromosomeArray, startPointPath])
        }
        return populationArray
    }
    function calculateFuelConsumption(Hsan, S, Hw, cargoWeight, mileageWithLoad, D) {
        // console.log('kut',Hsan, S, Hw, cargoWeight, mileageWithLoad, D)
        return 0.01 * (Hsan * S + Hw * cargoWeight * mileageWithLoad) * (1 + 0.01 * D)
    }
    /// Сумма всех дорог между пунктами
    function callFitness(population) {
        let weightInCar = maxWeightInCar;
        return population.map((chromosome) => {
            const chromosomeCopy = [...chromosome];
            let fuelConsumption = 0;
            /// Расчет расхода топлива между точками
            let isReturnToDepo = false;
            for (let i = 0; i < chromosomeCopy.length - 1; i++) {
                let firstPoint = isReturnToDepo ? 0 : chromosome[i]
                let secondPoint = chromosomeCopy[i + 1];
                /// Если грузоподъемность больше веса доставка
                if (weightInCar > shippingWeight[secondPoint]) {
                    fuelConsumption += calculateFuelConsumption(Hsan, distanceMatrix[firstPoint][secondPoint], Hw, weightInCar, distanceMatrix[firstPoint][secondPoint], D);
                    isReturnToDepo = false;
                    weightInCar -= shippingWeight[secondPoint];
                }
                else if (weightInCar <= shippingWeight[secondPoint]) {
                    while (weightInCar <= shippingWeight[secondPoint]) {
                        fuelConsumption += calculateFuelConsumption(Hsan, distanceMatrix[firstPoint][secondPoint], Hw, weightInCar, distanceMatrix[firstPoint][secondPoint], D);
                        fuelConsumption += calculateFuelConsumption(Hsan, distanceMatrix[secondPoint][0], Hw, 0, distanceMatrix[secondPoint][0], D)
                        isReturnToDepo = true;
                        shippingWeight[secondPoint] -= weightInCar;
                        weightInCar = 5.5;
                        firstPoint = 0;
                    }

                }
            }
            return fuelConsumption
        })
    }
    /// выбираем родителей на основе функции пригодности. Выбираем столько особей, сколько перадали в качеств параметра
    function selectParents(population, fitnessValues, parentsCount) {
        const fitnessValuesArr = fitnessValues.map((item, ind) => [ind, item])
        fitnessValuesArr.sort((a,b) => a[1] - b[1]);
        const parents = []
        fitnessValuesArr.slice(0, parentsCount).forEach(item => parents.push(population[item[0]]));
        return parents
    }
    function crossover(parents) {
        const offspring = [];
        /// Последовательно скрещиваем всех особей, которых мы отобрали
        for (let k = 0; k < parents.length; k++) {
            /// Выбираем двух особей, но без первого и последнего гена (отвечают за начальную и конечную точку маршрута, не меняются)
            const parentOne = parents[k].slice(1, parents[k].length - 1);
            const parentTwo  = k + 1 > parents.length - 1 ? parents[0].slice(1, parents[0].length - 1) : parents[k + 1].slice(1, parents[k + 1].length - 1);

            /// Создаем точки разрыва для скрещивания. Они не могут  быть первым и последним генами равняться друг другу
            let breakPointsArray = []; /// [1,2,3,4, ... ]
            for (let w = 1; w < parentOne.length - 1; w++) {
                breakPointsArray.push(w)
            }
            const breakPointOneInd = Math.floor(Math.random() * breakPointsArray.length)
            const breakPointOne = breakPointsArray[breakPointOneInd];
            breakPointsArray = [...breakPointsArray.slice(0, breakPointOneInd), ...breakPointsArray.slice(breakPointOneInd + 1)];
            const breakPointTwo = breakPointsArray[Math.floor(Math.random() * breakPointsArray.length)];
            const [breakPointStart, breakPointEnd] = [breakPointOne, breakPointTwo].sort();

            /// Использую упорядоченное скрещивание. Фрагменты между точками разрыва меняются местами
            /// Далее проходим все гены первого родителя, начиная от второй точки разреза, и добавляем значения,
            /// если они не еще не присутствуют в хромосоме первого потомка.
            /// Затем, ту же самую операцию выполняем со вторым родителем и вторым потомком
            const parentOneFrag = parentOne.slice(breakPointStart, breakPointEnd + 1);
            const parentTwoFrag = parentTwo.slice(breakPointStart, breakPointEnd + 1);
            for (let parent of [[parentOne, parentTwoFrag], [parentTwo, parentOneFrag]]) {
                let offspringItem = [];
                for (let j = breakPointEnd + 1; j < breakPointEnd + 1 + (parent[0].length - parent[1].length); j++) {
                    let ind = j <= parent[0].length - 1 ? j : j % parent[0].length;
                    const gene = parent[0][ind];
                    if (offspringItem.includes(gene) || parent[1].includes(gene)) {
                        while(offspringItem.includes(parent[0][ind]) || parent[1].includes(parent[0][ind])) {
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
                offspringItem = [...offspringItem.slice(0, breakPointStart).reverse(), ...parent[1], ...offspringItem.slice(breakPointStart)]
                offspring.push([startPointPath, ...offspringItem, startPointPath])
                offspring.push(offspringItem);
            }
        }
        return offspring
    }
/// Мутация хромосомы. Меняет два рандомных гена местами
    function mutation(offspring) {
        const newOffspring = [...offspring];
        for (let i = 0; i < newOffspring.length; i++) {
            const chromosome = newOffspring[i].slice(1, newOffspring[i].length - 1)
            let geneOneInd = Math.floor(Math.random() * chromosome.length);
            let geneTwoInd = Math.floor(Math.random() * chromosome.length);
            while (geneOneInd === geneTwoInd) {
                geneTwoInd = Math.floor(Math.random() * chromosome.length);
            }
            [chromosome[geneOneInd], chromosome[geneTwoInd]] = [chromosome[geneTwoInd], chromosome[geneOneInd]];
            newOffspring[i] = [startPointPath, ...chromosome, startPointPath]
        }
        return newOffspring
    }
    const generationCount = 1;
    let newPopulation = generatePopulation(6);
    console.log('newPopulation', newPopulation)
    console.log('----------------')
    for (let i = 0; i < generationCount; i++) {
        const fitnessValues = callFitness(newPopulation.slice(0,1));
        console.log('fitnessValues', fitnessValues)
        // const selectedParents = selectParents(newPopulation, fitnessValues, 3);
        // console.log('selectedParents', selectedParents)
        // const offspring = crossover(selectedParents);
        // console.log('offspring',offspring)
        // newPopulation = mutation(offspring);
    }
    // const fitnessValues = callFitness(newPopulation);
    // const bestSolution = selectParents(newPopulation, fitnessValues, 1);
    // console.log('bestSolution', bestSolution)
}

createRoute(distanceMatrix, shippingWeight)
