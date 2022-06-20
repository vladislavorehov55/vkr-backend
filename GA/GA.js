
class GA {
    // метод для генерации целых случайных чисел в заданном диапозоне
    generateNumber(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    bestRes = []
    selectParents(population, fitnessValues, parentsCount) {
        const fitnessValuesArr = fitnessValues.map((item, ind) => [ind, item])
        fitnessValuesArr.sort((a, b) => a[1] - b[1]);
        const parents = []
        fitnessValuesArr.slice(0, parentsCount).forEach(item => parents.push(population[item[0]]));
        if (this.bestRes.length === 0) {
            this.bestRes[0] = fitnessValuesArr[0][1];
            this.bestRes[1] = parents[0]
        }
        else if (this.bestRes.length !== 0 && fitnessValuesArr[0][1] < this.bestRes[0]) {
            this.bestRes[0] = fitnessValuesArr[0][1];
            this.bestRes[1] = parents[0]
        }
        return parents
    }
    mutation(offspring, min, max) {
        const newOffspring = [...offspring];
        for (let i = 0; i < newOffspring.length; i++) {
            const chromosome = [...newOffspring[i]];
            let geneOneInd = this.generateNumber(min, max);
            let geneTwoInd = this.generateNumber(min, max);
            while (geneOneInd === geneTwoInd) {
                geneTwoInd = this.generateNumber(min, max);
            }
            [chromosome[geneOneInd], chromosome[geneTwoInd]] = [chromosome[geneTwoInd], chromosome[geneOneInd]];
            newOffspring[i] = chromosome;
        }
        return newOffspring
    }
}

module.exports = GA