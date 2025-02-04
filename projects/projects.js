import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Fetch project data
async function loadProjects() {
    try {
        const projects = await fetchJSON('../lib/projects.json');
        const projectsContainer = document.querySelector('.projects');
        const projectCountElement = document.querySelector('.projects-title');

        // Update the project count in the title
        if (projectCountElement) {
            projectCountElement.textContent = projects.length;
        }

        if (projectsContainer) {
            renderProjects(projects, projectsContainer, 'h2');  // Pass the whole array of projects
        } else {
            console.error("Projects container not found.");
        }
    } catch (error) {
        console.error("Error loading projects:", error);
    }
    
}

////// Build pie chart ///////
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let data = [
    { value: 1, label: 'apples' },
    { value: 2, label: 'oranges' },
    { value: 3, label: 'mangos' },
    { value: 4, label: 'pears' },
    { value: 5, label: 'limes' },
    { value: 5, label: 'cherries' },
  ];
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Create chart
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

const svg = d3.select('svg');
if (svg.empty()) {
    console.error("SVG container not found!");
} else {
    arcs.forEach((arc, idx) => {
        d3.select('svg')
          .append('path')
          .attr('d', arc)
          .attr("fill", colors(idx))
    });
}

// Add legend
let legend = d3.select('.legend');
if (legend.empty()) {
    console.error("Legend container not found!");
} else {
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
            .attr('class', `legend-item`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
}

loadProjects();