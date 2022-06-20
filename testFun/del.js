const arr = [[], [], [], [], [], []]
let j = 0;
for (let item of arr) {
  for (let i = 0; i < 6; i++) {
    if (i  === 5) {
      arr[j].push(generateNumber(1, 101));
      j += 1;
      continue
    }
    arr[j].push(generateNumber(1, 101))
  }
}
console.log(arr)
function generateNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

