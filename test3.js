class Worker {
  #name = null;
  #surname = null;
  #rate = null;
  #days = null;

  constructor(name, surname, rate, days) {
    this.#name = name;
    this.#surname = surname;
    this.#rate = rate;
    this.#days = days;
  }
  get Name() {
    return this.#name;
  }
  get Surname() {
    return this.#surname;
  }
  get Rate() {
    return this.#rate;
  }
  get Days() {
    return this.#days;
  }

  get Salary() {
    return this.#rate * this.#days;
  }
}
const worker = new Worker("Ivan", "Ivanov", 100, 31);

console.log(worker.Name); //выведет 'Иван'
console.log(worker.Surname); //выведет 'Иванов'
console.log(worker.Rate); //выведет 100
console.log(worker.Days); //выведет 31
console.log(worker.Salary);
