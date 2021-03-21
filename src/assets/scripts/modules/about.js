import gsap from 'gsap';

const about = document.querySelector('#js-about');

const aboutAnimation = gsap.timeline({
  paused: true,
  onReverseComplete: hideAbout
})
  .fromTo('.about__inner',
    { x: '-100%' },
    { x: 0, duration: 0.5, ease: 'circ.out' }
  )
  .fromTo('.about__content div',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.2, stagger: 0.15, ease: 'circ.inOut' }
  );

function openAbout () {
  document.body.classList.add('modal-open');
  about.classList.remove('is-hidden');
  aboutAnimation.timeScale(1).play();
}

function closeAbout () {
  aboutAnimation.timeScale(2).reverse();
}

function hideAbout () {
  document.body.classList.remove('modal-open');
  about.classList.add('is-hidden');
}

function handleClick (event) {
  const open = event.target.closest('#js-about-open');
  const close = event.target.closest('#js-about-close');

  if (open) {
    openAbout();
  }

  if (close) {
    closeAbout();
  }
}

function handleKeydown (event) {
  if (event.key === 'Escape') {
    closeAbout();
  }
}

export default function () {
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);
}
