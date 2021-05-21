import axios from 'axios';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import about from './about';
import animations from './animations';
import sphere, { onWindowResize, onWindowLoad } from './sphere';
import slider from './slider';

gsap.registerPlugin(ScrollToPlugin);

let hideContentTl;
let currentPage;
let content;
let delay;
let request;

const container = document.querySelector('#js-ajax-container');
const header = document.querySelector('#js-header');
const headerContents = header.querySelector('.header__contents');
const loader = document.querySelector('#js-loader');

function handleClick (event) {
  const link = event.target.closest('.js-ajax-link');

  if (link) {
    event.preventDefault();

    // Remove event listeners from sphere.js
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('load', onWindowLoad);

    // Load the new content
    loadAjaxContent(link.href, false);
  }
}

function loadAjaxContent (url, isPopState) {
  // Add root class to prevent overflow
  document.documentElement.classList.add('page-is-loading');

  // Set the currentPage based on body class
  currentPage = document.querySelector('body').classList[0];

  // Animate the content out
  if (currentPage === 'home') {
    // Store the current scrollY so we can return to it
    window.sessionStorage.setItem('prevY', window.scrollY);
    leaveHomeAnimation();
  } else {
    leaveEntryAnimation();
  }

  request = axios.get(url)
    .then(response => {
      return processAjax(response, url, isPopState);
    })
    .catch(error => console.log(error));

  // Set a minimum delay so animations don't run too quick
  delay = new Promise(resolve => setTimeout(resolve, 1000));
}

function leaveHomeAnimation () {
  // Leave animation for Homepage -> Entry
  hideContentTl = gsap.timeline()
    .set(loader, { display: 'flex', opacity: 1 })
    .to('#js-ajax-content', {
      opacity: 0,
      duration: 0.2
    })
    .to(loader, {
      y: 0,
      duration: 0.5,
      ease: 'circ.out'
    })
    .to(window, {
      scrollTo: 0,
      duration: 0
    })
    .set(header, { display: 'block' })
    .fromTo(headerContents, { opacity: 0 }, {
      opacity: 1,
      duration: 0.2
    });
}

function leaveEntryAnimation () {
  // Leave animation for Entry -> Homepage
  hideContentTl = gsap.timeline()
    .set(loader, { display: 'flex', opacity: 0 })
    .to('#js-ajax-content', {
      opacity: 0,
      duration: 0.2
    })
    .to(loader, {
      opacity: 1,
      duration: 0.2
    });
  // .to(window, {
  //   scrollTo: 0,
  //   duration: 0
  // });
}

function processAjax (response, url, isPopState) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data, 'text/html');
  content = doc.querySelector('#js-ajax-content');
  const bodyClass = doc.querySelector('body').classList;

  // Make sure ajax request, hide content and delay have all resolved
  Promise.allSettled([hideContentTl, request, delay]).then(() => {
    // Update title
    document.title = doc.querySelector('title').innerHTML;

    // Clear container and add new content
    container.innerHTML = '';
    container.appendChild(content);

    // Animate the content out
    if (currentPage === 'home') {
      revealEntryAnimation();
    } else {
      // console.log(window.sessionStorage.getItem('prevY'));
      revealHomeAnimation();
    }

    // If the new page has a class on the body element
    // Make sure it gets set here.
    if (bodyClass !== '') {
      document.body.classList = '';
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList = '';
    }

    document.documentElement.classList.remove('page-is-loading');

    // Initialise interactive elements
    animations();
    about();
    sphere();
    slider();

    // Update browser history
    if (isPopState === false) {
      history.pushState({ url }, null, url);
    }
  });
}

function revealHomeAnimation () {
  // Reveal animation for Entry -> Homepage
  gsap.timeline()
    .to(headerContents, {
      opacity: 0,
      duration: 0.2
    })
    .set(header, { display: 'none' })
    .to(loader, {
      y: '100%',
      duration: 0.5
    })
    .to(window, {
      scrollTo: window.sessionStorage.getItem('prevY') || 0,
      duration: 0
    })
    .fromTo(content, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.3
    })
    .set(loader, { display: 'none', opacity: 0 });
}

function revealEntryAnimation () {
  // Reveal animation for Homepage -> Entry
  gsap.timeline()
    .add('fade')
    .fromTo(content, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.3
    }, 'fade')
    .to(loader, {
      opacity: 0,
      duration: 0.2
    }, 'fade')
    .set(loader, { display: 'none' });
}

function handlePop (event) {
  loadAjaxContent(event.state.url, true);
}

export default function () {
  document.addEventListener('click', handleClick);
  window.addEventListener('popstate', handlePop);

  // Initialise history state with state
  const url = location.href;
  history.replaceState({ url, modal: false }, null, url);
}
