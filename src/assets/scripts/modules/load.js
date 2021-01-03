import gsap from 'gsap';

function loadAnimation() {
  const header = document.querySelector('.header');
  const main = document.querySelector('main');
  const footer = document.querySelector('.footer');

  gsap.timeline()
    .to(header, { opacity: 1 })
    .to(main, { opacity: 1, y: 0 })
    .to(footer, { opacity: 1 });
}

export default function() {
  window.addEventListener('load', loadAnimation);
}
