class User {
  constructor(name, surname) {
    this.name = name;
    this.surname = surname;
  }

  get FullName() {
    return `${this.name} ${this.surname}`;
  }
}

class Student extends User {
  constructor(name, surname, year) {
    super(name, surname);
    this.year = year;
  }
  get Course() {
    return new Date().getFullYear() - this.year;
  }
}

const student = new Student("Ivan", "Ivanov", 2018);
console.log(student.name); //выведет 'Иван'
console.log(student.surname); //выведет 'Иванов'
console.log(student.FullName); //выведет 'Иван Иванов'
console.log(student.year); //выведет 2018
console.log(student.Course);
