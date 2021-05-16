import gsap from 'gsap';

let about;
let aboutAnimation;

function init () {
  about = document.querySelector('#js-about');

  aboutAnimation = gsap.timeline({
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
}

function openAbout () {
  document.body.classList.add('modal-open');
  about.classList.remove('is-hidden');
  aboutAnimation.timeScale(1).play();
  document.querySelector('#js-about-close').focus();
  // TODO: Make all links outside about modal not focusable.
}

function closeAbout () {
  aboutAnimation.timeScale(2).reverse();
}

function hideAbout () {
  document.body.classList.remove('modal-open');
  about.classList.add('is-hidden');
  document.querySelector('#js-about-open').focus();
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
  if (document.querySelector('#js-about')) {
    init();
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
  }
}
