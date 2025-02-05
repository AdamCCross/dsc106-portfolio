import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/// Global Variables
let globalIndex = -1;
let globalNewData = [];

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
function renderPieChart(projectsGiven) {
    let selectedIndex = -1

    // re-calculate rolled data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
      );

    // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
      });
    globalNewData = newData;

    // Define arc generator and color scale
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // re-calculate slice generator, arc data, arc, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // Clear up paths and legends
    let newSVG = d3.select('svg');
    newSVG.selectAll('*').remove();  // Remove existing paths

    let newLegend = d3.select('.legend');
    newLegend.selectAll('*').remove();  // Remove existing legends

    // update paths and legends, refer to steps 1.4 and 2.2
    // Create chart
    if (newSVG.empty()) {
        console.error("SVG container not found!");
    } else {
        newArcs.forEach((arc, idx) => {
            newSVG.append('path')
                .attr('d', arc)
                .attr("fill", colors(idx))
                .attr('data-index', idx)
                .on('click', function() {
                    selectedIndex = selectedIndex === idx ? -1 : idx;
                    
                    newSVG.selectAll('path')
                        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
                    
                    newLegend.selectAll('li')
                        .attr('class', (_, idx) => idx === selectedIndex ? 'legend-item selected' : 'legend-item');
                    
                    globalIndex = selectedIndex;

                    filterAndRenderProjects(projectsGiven, selectedIndex, newData)
              });
        });
    }
    // Add legend
    if (newLegend.empty()) {
        console.error("Legend container not found!");
    } else {
        newData.forEach((d, idx) => {
            newLegend.append('li')
                .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
                .attr('class', `legend-item`)
                .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`) // set the inner html of <li>
                .on('click', function() {
                    selectedIndex = selectedIndex === idx ? -1 : idx;
                    
                    newSVG.selectAll('path')
                        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
                    
                    newLegend.selectAll('li')
                        .attr('class', (_, idx) => idx === selectedIndex ? 'legend-item selected' : 'legend-item');

                    globalIndex = selectedIndex;
                    
                    filterAndRenderProjects(projectsGiven, selectedIndex, newData)
              });
        });
    }
}

let projects = await fetchJSON('../lib/projects.json'); // fetch your project data
renderPieChart(projects)
loadProjects();

// Function to filter and render projects based on selected year
function filterAndRenderProjects(projectsGiven, selectedIndex, newData) {
    const projectsContainer = document.querySelector('.projects');
    
    if (selectedIndex === -1) {
        renderProjects(projectsGiven, projectsContainer, 'h2');
    } else {
        const selectedYear = newData[selectedIndex].label;
        const filteredProjects = projectsGiven.filter(project => project.year === selectedYear);
        renderProjects(filteredProjects, projectsContainer, 'h2');
    }
}

////// Build Project Search ///////
let query = '';
let searchInput = document.querySelector('.searchBar');
let projectsContainer = document.querySelector('.projects');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  if (globalIndex === -1) {
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });
    // render filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects)
  } else {
    const selectedYear = globalNewData[globalIndex].label;
    let filteredProjects = projects.filter(project => project.year === selectedYear);
    filteredProjects = filteredProjects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });
    // render filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
  }
});