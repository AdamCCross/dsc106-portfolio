import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Global Variables
let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits;
let xScale;
let yScale;

// Variables for filtering UI
let commitProgress = 100;
let timeScale; // Declare globally
let commitMaxTime;

// Load data function
async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    displayStats();
}

// processes Commits function
function processCommits() {
    commits = d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            // Each 'lines' array contains all lines modified in this commit
            // All lines in a commit have the same author, date, etc.
            // So we can get this information from the first line
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/vis-society/lab-7/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                // Calculate hour as a decimal for time analysis
                // e.g., 2:30 PM = 14.5
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                // How many lines were modified?
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
            });

            return ret;
    });
    // Initialize timeScale only after commits is populated
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    // Update commitMaxTime based on initial commitProgress
    commitMaxTime = timeScale.invert(commitProgress);
    
}

function displayStats() {
    // Process commits first
    processCommits();

    // Compute statistics
    const uniqueFiles = d3.group(data, d => d.file).size; // Unique file count
    const maxLineLength = d3.max(data, d => d.length); // Longest line length
    const maxFileLines = d3.max(d3.rollup(data, v => v.length, d => d.file).values()); // Max file length
    const maxFileDepth = d3.max(data, d => d.depth); // Max file depth
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
    
    // Add Number of files in codebase
    dl.append('dt').html('Files');
    dl.append('dd').text(uniqueFiles);

    // Longest line length
    dl.append('dt').html('Longest Line');
    dl.append('dd').text(maxLineLength);

    // Maximum file length (in lines)
    dl.append('dt').html('Max Lines');
    dl.append('dd').text(maxFileLines);

    // Maximum file depth
    dl.append('dt').html('Max Depth');
    dl.append('dd').text(maxFileDepth);

}

function updateScatterplot(filteredCommits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 50 }; // More space for the Y-axis labels
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);

    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 20]);

    // Ensure SVG exists
    let svg = d3.select('#chart svg');
    if (svg.empty()) {
        svg = d3.select('#chart')
            .append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('overflow', 'visible');

        // Create groups for axes
        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${usableArea.bottom})`);
        svg.append("g").attr("class", "y-axis").attr("transform", `translate(${usableArea.left}, 0)`);
    }

    xScale = d3.scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top])
        .nice();

    // Update axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%b %d")); // Format date labels
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg.select(".x-axis").transition().duration(500).call(xAxis);
    svg.select(".y-axis").transition().duration(500).call(yAxis);

    // Select or create dots group
    let dots = svg.select('.dots');
    if (dots.empty()) {
        dots = svg.append('g').attr('class', 'dots');
    }

    // JOIN: Bind data to existing circles
    const circles = dots.selectAll('circle').data(commits, d => d.id);

    // UPDATE: Transition circles that should remain
    circles.transition()
        .duration(500)
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => filteredCommits.includes(d) ? rScale(d.totalLines) : 0) // Shrink radius
        .style('fill-opacity', d => filteredCommits.includes(d) ? 0.7 : 0); // Fade out

    // ENTER: Append new circles
    circles.enter()
        .append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', 0) // Start with radius 0
        .style('fill-opacity', 0)
        .attr('fill', 'steelblue')
        .transition()
        .duration(500)
        .attr('r', d => rScale(d.totalLines))
        .style('fill-opacity', 0.7);

    // EXIT: Transition circles out
    circles.exit()
        .transition()
        .duration(500)
        .attr('r', 0)
        .style('fill-opacity', 0)
        .remove();
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
    const svg = document.querySelector('svg');
    // Create brush
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
    
    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function brushed(evt) {
    let brushSelection = evt.selection;

    selectedCommits = !brushSelection
      ? []
      : commits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.date);
          let y = yScale(commit.hourFrac);
  
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
  }
  
function isCommitSelected(commit) { 
    return selectedCommits.includes(commit); 
} 
  
function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle')
      .classed('selected', d => isCommitSelected(d));
}

function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
}

function updateLanguageBreakdown() {
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
}

// Function to update the commit time based on the slider
function updateCommitFilter(value) {
    commitProgress = value;
    commitMaxTime = timeScale.invert(commitProgress);
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    // Update the displayed time
    const formattedTime = commitMaxTime.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true, // Ensures AM/PM format
    });

    // Update the displayed time
    d3.select("#selectedTime").text(formattedTime);
}

document.addEventListener('DOMContentLoaded', async () =>{
    await loadData();
    updateScatterplot(commits);
    brushSelector();
    updateTooltipVisibility(false);
    updateCommitFilter(commitProgress)
    // Event listener for slider
    d3.select("#commit-slider").on("input", function() {
        updateCommitFilter(this.value);
        updateScatterplot(filteredCommits)
});
});



