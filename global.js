console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//// Create Naviation in JS ////

// create pages
let pages = [
    { url: '', title: 'Home'},
    { url: '/dsc106-portfolio/projects/', title: 'Projects'},
    { url: '/dsc106-portfolio/resume/', title: 'Resume'},
    { url: '/dsc106-portfolio/contact/', title: 'Contact'},
    { url: 'https://github.com/AdamCCross', title: 'Github'},
]

// add nav element to the body of page
let nav = document.createElement('nav');
document.body.prepend(nav);

// create constant variable that checks for home class in page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// create links and add attributes as needed
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
    // create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    // add current class to current page
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
      }
    // have link open new path if external link
    if (a.host !== location.host) {
        a.target = "_blank";
      }
}

//// Add Light and Dark Modes ////
document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
            <option value="light dark">Automatic</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
      </label>`
  );

let select = document.querySelector('.color-scheme select');

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
  });

if (localStorage.colorScheme) {
    // Apply the stored color scheme
    const storedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', storedScheme);
    select.value = storedScheme; // Update the select element to match
}

//// Contact Form ////

let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault();

    let data = new FormData(form);
    let url = form.action
    let queryParams = [];

    // Iterate over each form field and build the query parameters
    for (let [name, value] of data) {
        // TODO build URL parameters here
        queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
      }

    // Join the parameters with "&"
    if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
    }

    console.log("Generated URL:", url); // Log the generated URL for inspection
    
    location.href = url;
    console.log('Form submitted');
});