import { fetchJSON, renderProjects, fetchGitHubData } from '../global.js';

// Display latest projects
const projects = await fetchJSON('../lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');


console.log('Projects:', latestProjects);
renderProjects(latestProjects, projectsContainer, 'h2');

// Display github API data
const githubData = await fetchGitHubData('giorgianicolaou');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          </dl>
      `;
  }