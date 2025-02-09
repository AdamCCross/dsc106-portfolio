console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//// Create Naviation in JS ////

// create pages
let pages = [
    { url: '', title: 'Home'},
    { url: 'projects/', title: 'Projects'},
    { url: 'resume/', title: 'Resume'},
    { url: 'contact/', title: 'Contact'},
    { url: 'meta/', title: 'Meta'},
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

//// Importing Project Data into Projects Page ////
export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      // Check if fetch request was successful
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data; 


  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
      return [];// Return an empty array to prevent undefined errors
  }
}

/// dynamically generate and display project content throughout site func
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Ensure containerElement is a valid DOM element
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    console.error("Invalid container element provided.");
    return;
  }
  // Validate headingLevel (ensure it's a valid heading tag)
  const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadings.includes(headingLevel)) {
      console.warn(`Invalid heading level "${headingLevel}". Defaulting to "h2".`);
      headingLevel = 'h2';
  }
  // Clear existing content to avoid duplication
  containerElement.innerHTML = '';

  // Check if there are any projects to render
  if (projects.length === 0) {
    const placeholderMessage = document.createElement('p');
    placeholderMessage.textContent = 'No projects available at the moment. Please check back later!';
    containerElement.appendChild(placeholderMessage);
    return;
  }

  // Loop through each project and create an article element
  projects.forEach(project => {
    // Validate project data
    if (!project || !project.title || !project.description) {
        console.warn("Skipping invalid project:", project);
        return;
    }
    // Create article element
    const article = document.createElement('article');

    // Add project details to article 
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      ${project.image ? `<img src="${project.image}" alt="${project.title}">` : ''}
      <div>
      <p>${project.description}</p>
      <p class="year"><i>c.</i> ${project.year}</p></div>
    `;
    // Append the article to container
    containerElement.appendChild(article);
  });
}

//// Loading data from Github API ////
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}