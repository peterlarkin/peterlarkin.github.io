import axios from 'axios';
import gsap from 'gsap';

let hideContent, delay, request;
const container = document.querySelector('#js-ajax-container');
const loader = document.querySelector('#js-loader');

function handleClick(event) {
  const link = event.target.closest('.js-ajax-link');

  if (link) {
    event.preventDefault();
    loadAjaxContent(link.href, false);
    return;
  }
}

function loadAjaxContent(url, isPopState) {
  const currentContent = document.querySelector('#js-ajax-content');
  // Animate the loader
  hideContent = gsap.timeline()
    .set(loader, { display: 'flex' })
    .to(currentContent, {
      opacity: 0,
      y: 30,
      duration: 0.3
    })
    .to(loader, {
      opacity: 1,
      duration: 0.3,
      // ease: "power2.out"
    });

  // Run the ajax request
  request = axios.get(url)
    .then(response => {
      return processAjax(response, url, isPopState);
    })
    .catch(error => console.log(error));

  // Set a minimum delay so animations don't run too quick
  delay = new Promise(resolve => setTimeout(resolve, 900));
}

function processAjax(response, url, isPopState) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.data,"text/html");
  const content = doc.querySelector('#js-ajax-content');
  const bodyClass = doc.querySelector('body').classList;

  // Make sure ajax request, hide content and delay have all resolved
  Promise.allSettled([hideContent, request, delay]).then(() => {
    // Update title
    document.title = doc.querySelector('title').innerHTML;

    // Clear container and add new content
    container.innerHTML = '';
    container.appendChild(content);

    // Make sure page is scrolled to the top
    document.documentElement.scrollTop = 0;

    // Hide the loader
    gsap.timeline()
      .add('fade')
      .fromTo(content, {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3
      }, 'fade')
      .to(loader, {
        opacity: 0,
        duration: 0.3,
      }, 'fade')
      .set(loader, { display: 'none' });

    // If the new page has a class on the body element
    // Make sure it gets set here.
    if (bodyClass != "") {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList = "";
    }

    // Update browser history
    if (isPopState === false) {
      history.pushState({ url }, null, url);
    }
  });
}

function handlePop(event) {
  loadAjaxContent(event.state.url, true);
}

export default function() {
  document.addEventListener('click', handleClick);
  window.addEventListener('popstate', handlePop);

  // Initialise history state with current URL
  const url = location.href;
  history.replaceState({ url }, null, url);
}
