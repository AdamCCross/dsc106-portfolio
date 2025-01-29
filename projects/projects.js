import { fetchJSON, renderProjects } from '../global.js';

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

loadProjects();