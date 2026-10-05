const capitulos = document.querySelectorAll('.capitulo');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visivel');
    }
  });
}, { threshold: 0.1 });

capitulos.forEach(cap => observer.observe(cap));

