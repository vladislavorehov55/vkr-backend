const groupRoutes = (routesDistanceMatrix, countDrivers) => {
    function generatePopulation(populationSize) {
        const populationArray = [];
        for (let i = 0; i < populationSize; i++) {
            const chromosomeArray = [];
            while (chromosomeArray.length !== routesDistanceMatrix.length) {
                const newPathPoint = Math.floor(Math.random() * (routesDistanceMatrix.length));
                if (!chromosomeArray.includes(newPathPoint)) {
                    chromosomeArray.push(newPathPoint);
                }
            }
            populationArray.push(chromosomeArray);
        }
        return populationArray
    }

    function callFitness(population) {
        return population.map(chromosome => {
            let allSum = 0;
            const countPath = Math.ceil((chromosome.length) / countDrivers);
            for (let i = 0; i < chromosome.length; i += countPath) {
                const chromosomePath = chromosome.slice(i, i + countPath);
                for (let j = 0; j < chromosomePath.length - 1; j++) {
                    const firstPoint = chromosomePath[j];
                    const secondPoint = chromosomePath[j + 1];
                    allSum += routesDistanceMatrix[firstPoint][secondPoint]
                }
            }
            return allSum
        })
    }

    function selectParents(population, fitnessValues, parentsCount) {
        const fitnessValuesArr = fitnessValues.map((item, ind) => [ind, item])
        fitnessValuesArr.sort((a, b) => a[1] - b[1]);
        const parents = []
        fitnessValuesArr.slice(0, parentsCount).forEach(item => parents.push(population[item[0]]));
        return parents
    }

    function crossover(parents) {
        const offspring = [];
        for (let k = 0; k < parents.length; k++) {
            const parentOne = parents[k];
            const parentTwo = k + 1 > parents.length - 1 ? parents[0] : parents[k + 1];

            let breakPointsArray = []; /// [0,1,2,3,4, ... ]
            for (let w = 1; w < parentOne.length - 1; w++) {
                breakPointsArray.push(w)
            }
            const breakPointOneInd = Math.floor(Math.random() * breakPointsArray.length)
            const breakPointOne = breakPointsArray[breakPointOneInd];
            breakPointsArray = [...breakPointsArray.slice(0, breakPointOneInd), ...breakPointsArray.slice(breakPointOneInd + 1)];
            const breakPointTwo = breakPointsArray[Math.floor(Math.random() * breakPointsArray.length)];
            const [breakPointStart, breakPointEnd] = [breakPointOne, breakPointTwo].sort();

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
                offspring.push(offspringItem);
            }
        }
        return offspring
    }

    function mutation(offspring) {
        const newOffspring = [...offspring];
        for (let i = 0; i < newOffspring.length; i++) {
            const chromosome = [...newOffspring[i]];
            let geneOneInd = Math.floor(Math.random() * chromosome.length);
            let geneTwoInd = Math.floor(Math.random() * chromosome.length);
            while (geneOneInd === geneTwoInd) {
                geneTwoInd = Math.floor(Math.random() * chromosome.length);
            }
            [chromosome[geneOneInd], chromosome[geneTwoInd]] = [chromosome[geneTwoInd], chromosome[geneOneInd]];
            newOffspring[i] = chromosome;
        }
        return newOffspring
    }

    const generationCount = 10;
    let newPopulation = generatePopulation(60);
    for (let i = 0; i < generationCount; i++) {
        const fitnessValues = callFitness(newPopulation);
        const selectedParents = selectParents(newPopulation, fitnessValues, 10);
        const offspring = crossover(selectedParents);
        newPopulation = mutation(offspring)
    }
    const fitnessValues = callFitness(newPopulation);
    const [bestSolution] = selectParents(newPopulation, fitnessValues, 1);
    const arr = [];
    for (let i = 0; i < bestSolution.length; i += Math.ceil((bestSolution.length) / countDrivers)) {
        arr.push(bestSolution.slice(i, i + Math.ceil((bestSolution.length) / countDrivers)))
    }
    console.log('arr',arr)
    return arr

}
const matrix = [
    [99999999, 1, 10, 20, 30, 40],
    [1, 99999999, 11, 21, 31, 41],
    [10, 11, 99999999, 2, 32, 42],
    [20, 21, 2, 99999999, 33, 43],
    [30, 31, 32, 33, 99999999, 3],
    [40, 41, 43, 43, 3, 99999999]
]
groupRoutes(matrix, 3)
