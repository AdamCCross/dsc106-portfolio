import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Global Variables
let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits;
let xScale;
let yScale;
let commitProgress = 100;
let timeScale; 
let commitMaxTime;
let lines;
let files = [];

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
    processCommits();
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

function displayStats(filteredCommits) {
    // Process filteredCommits instead of all commits
    const uniqueFiles = d3.group(filteredCommits.flatMap(d => d.lines), d => d.file).size; // Unique file count
    const maxLineLength = d3.max(filteredCommits.flatMap(d => d.lines), d => d.length); // Longest line length
    const maxFileLines = d3.max(d3.rollup(filteredCommits.flatMap(d => d.lines), v => v.length, d => d.file).values()); // Max file length
    const maxFileDepth = d3.max(filteredCommits.flatMap(d => d.lines), d => d.depth); // Max file depth

    // Create the dl element
    const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(filteredCommits.length);

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(filteredCommits.flatMap(d => d.lines).length);

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

    // Format the y-axis ticks as times (e.g., "12:00 AM", "1:00 AM")
    const timeFormat = d3.timeFormat('%I:%M %p');  // Format for "12:00 AM", "1:00 AM", etc.

    // Update axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.timeFormat("%b %d")); // Format date labels

    const yAxis = d3.axisLeft(yScale)
        .ticks(12)
        .tickSize(-usableArea.width)
        .tickFormat(d => timeFormat(new Date(0, 0, 0, d, 0)));  // Format as time

    svg.select(".x-axis").transition().duration(500).call(xAxis);
    svg.select(".y-axis").transition().duration(500).call(yAxis);

    // Add grid lines with light grey color
    svg.selectAll('.y-axis line')
        .style('stroke', '#d3d3d3')  // Light grey color for grid lines
        .style('stroke-width', 1);  // Set the grid line thickness

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
        .on('mouseover', function(event, d) {
            updateTooltipContent(d);
            updateTooltipPosition(event);
            updateTooltipVisibility(true);
        })
        .on('mousemove', function(event) {
            updateTooltipPosition(event);
        })
        .on('mouseout', function() {
            updateTooltipVisibility(false);
        })
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
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
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

    displayStats(filteredCommits);
    updateScatterplot(filteredCommits);
    updateFileVisualization(filteredCommits);
}

function updateFileVisualization(filteredCommits) {
    lines = filteredCommits.flatMap((d) => d.lines);
    files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        });
    files = d3.sort(files, (d) => -d.lines.length);

    d3.select('.files').selectAll('div').remove();
    let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
        
    filesContainer.append('dt').html(d => {
        return `<code>${d.name}</code><small>${d.lines.length} lines</small>`;
    });
    filesContainer.append('dd')
        .selectAll('div')  // Create a div for each line in the file
        .data(d => d.lines)  // Bind data to divs, where each div represents a line
        .enter()
        .append('div')
        .attr('class', 'line')  // Apply the 'line' class for styling
        .style('height', '4px')  // Example height of each line (you can adjust this)
        .style('margin-bottom', '2px')  // Space between the lines
        .style('background-color', '#3498db');  // Example color for each line (adjust as needed)
}

document.addEventListener('DOMContentLoaded', async () =>{
    await loadData();
    updateCommitFilter(commitProgress);
    brushSelector();
    // Event listener for slider
    d3.select("#commit-slider").on("input", function() {
        updateCommitFilter(this.value);
    });
});



