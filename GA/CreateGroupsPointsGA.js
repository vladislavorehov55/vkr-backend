
const GA = require('./GA');
class CreateGroupsPointsGA extends GA{
    constructor(distanceMatrix, countDrivers) {
        super();
        this.distanceMatrix = distanceMatrix;
        this.countDrivers = countDrivers;
    }
    generatePopulation(populationSize, distanceMatrix) {
        const populationArray = [];
        for (let i = 0; i < populationSize; i++) {
            const chromosomeArray = [];
            while (chromosomeArray.length !== distanceMatrix.length) {
                const newPathPoint = super.generateNumber(0, distanceMatrix.length);
                if (!chromosomeArray.includes(newPathPoint)) {
                    chromosomeArray.push(newPathPoint);
                }
            }
            populationArray.push(chromosomeArray);
        }
        return populationArray
    }

    getRoutesByDrivers(chromosome, countDrivers) {
        if (chromosome.length < countDrivers) {
            countDrivers = chromosome.length;
        }
        const chromosomePath = Array.from(new Array(countDrivers), () => []);
        let iter = 0;
        for (let i = 0; i < chromosome.length; i++) {
            if (i === 0) {
                chromosomePath[i].push(chromosome[i]);
            }
            else {
                if (i % countDrivers === 0) {
                    iter += 1;
                }
                chromosomePath[i - iter * chromosomePath.length].push(chromosome[i])
            }
        }
        return chromosomePath
    }
    callFitness(population, countDrivers, distanceMatrix) {
        return population.map(chromosome => {
            let allSum = 0;
            const chromosomePath = this.getRoutesByDrivers(chromosome, countDrivers);
            for (let i = 0; i < chromosomePath.length; i++) {
                if (chromosomePath[i].length === 2) {
                    const firstPoint = chromosomePath[i][0];
                    const secondPoint = chromosomePath[i][1];
                    allSum += distanceMatrix[firstPoint][secondPoint];
                }
                else if (chromosomePath[i].length > 2) {
                    for (let j = 0; j < chromosomePath[i].length; j++) {
                        const item = chromosomePath[i];
                        const firstPoint = item[j];
                        const secondPoint = i === item.length - 1 ? item[0] : item[j + 1];
                        allSum += distanceMatrix[firstPoint][secondPoint]
                    }
                }
            }
            return allSum
        })
    }


    crossover(parents) {
        const offspring = [];
        for (let k = 0; k < parents.length; k++) {
            const parentOne = parents[k];
            const parentTwo = k + 1 > parents.length - 1 ? parents[0] : parents[k + 1];

            let breakPointsArray = []; /// [0,1,2,3,4, ... ]
            for (let w = 1; w < parentOne.length - 1; w++) {
                breakPointsArray.push(w)
            }
            let breakPointOne = null;
            let breakPointTwo = null;
            if (parentOne.length === 3) {
                breakPointOne = breakPointTwo = 1;
            }
            else {
                let breakPointOneInd = super.generateNumber(0, breakPointsArray.length);
                breakPointOne = breakPointsArray[breakPointOneInd];
                breakPointsArray = [...breakPointsArray.slice(0, breakPointOneInd), ...breakPointsArray.slice(breakPointOneInd + 1)];
                breakPointTwo = breakPointsArray[super.generateNumber(0, breakPointsArray.length)];
            }

            let [breakPointStart, breakPointEnd] = [breakPointOne, breakPointTwo].sort();

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
        return [...offspring, ...parents]
    }

    execute() {
        const generationCount = 10;
        let newPopulation = this.generatePopulation(60, this.distanceMatrix);
        for (let i = 0; i < generationCount; i++) {
            const fitnessValues = this.callFitness(newPopulation, this.countDrivers, this.distanceMatrix);
            const selectedParents = this.selectParents(newPopulation, fitnessValues, 10);
            const offspring = this.crossover(selectedParents);
            newPopulation = super.mutation(offspring, 0, offspring[0].length)
        }
        const fitnessValues = this.callFitness(newPopulation, this.countDrivers, this.distanceMatrix);
        const [bestSolution] = this.selectParents(newPopulation, fitnessValues, 1);
        const arr = this.getRoutesByDrivers(bestSolution, this.countDrivers);
        return arr
    }
}

// const matrix = [
//     [99999999, 1, 10, 20, 30, 40],
//     [1, 99999999, 11, 21, 31, 41],
//     [10, 11, 99999999, 2, 32, 42],
//     [20, 21, 2, 99999999, 33, 43],
//     [30, 31, 32, 33, 99999999, 3],
//     [40, 41, 43, 43, 3, 99999999]
// ]
// const matrix = [[ 100000000, 1, 6 ],
//     [ 3, 100000000, 7 ],
//     [ 6, 7, 100000000 ]
// ]
//
// const ga = new CreateGroupsPointsGA(matrix, 2)
// ga.execute()

module.exports = CreateGroupsPointsGA;