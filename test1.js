class Elem {
  constructor(selectors) {
    this.elems = Array.from(document.querySelectorAll(selectors));
  }

  html(text) {
    this.elems.map((elem) => (elem.innerHTML = text));
    return this;
  }

  append(text) {
    this.elems.map((elem) => elem.append(text));
    return this;
  }

  prepend(text) {
    this.elems.map((elem) => elem.prepend(text));
    return this;
  }

  attr(name, value) {
    this.elems.map((elem) => elem.setAttribute(name, value));
    return this;
  }
}

const elem = new Elem(".elem");

elem
  .html("!")
  .attr("data-id", Math.floor(Math.random() * 6) + 1)
  .append("a")
  .prepend("b");
