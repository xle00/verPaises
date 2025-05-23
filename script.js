fetch("./data.json").then(response => response.json()).then(data => {
    print = console.log
    console.log(data.filter(d => !d.population || !d.area));

    const width = 1000
    const height = 700
    const baseSize = Math.min(width, height)
    const spacing = 10

    const svg = d3.select("#chart")
    .append('svg')
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr('preserveAspectRatio', "xMidYMid meet")
    .attr('width', "100%")
    .attr('height', "100%")
    .style('background-color', "#888")

    const container = svg.append("g")

    // Set the scale for the correct data selected
    function getSizeScale(metric, data) {
        const value = {
            population: d=> d.population,
            area: d => d.area, 
            density: d => d.population / d.area,
            
        }[metric]

        return d3.scaleSqrt()
        .domain([d3.min(data, value), d3.max(data, value)])
        .range([baseSize * 0.00615, baseSize * 0.18])
    }

    // Set starting data
    let currentMetric = 'area';
    let size = getSizeScale(currentMetric, data);
   
    const tooltip = d3.select(".tooltip")

    // Set up simulation for bubbles
    const simulation = d3.forceSimulation(data)
    .force("center", d3.forceCenter(width/2, height/2))
    .force("charge", d3.forceManyBody().strength(5))
    .force('collision', d3.forceCollide().radius(d => size(getMetricValue(d, currentMetric)) + spacing))
    .on('tick', () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    })

    // Create pattern for bubbles
    const defs = svg.append("defs");
    data.forEach((d, i) => {
    defs.append("pattern")
        .attr("id", `flag-${i}`)
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("href", d.flags?.png)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("width", 1)
        .attr("height", 1)
        .attr("x", 0)
        .attr("y", 0);
    });

    // Create bubbles
    const node = container.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", d => size(getMetricValue(d, currentMetric)))
    .attr("fill", (d, i) => `url(#flag-${i})`)
    .on("mouseover", function(event, d) {

        // Set stroke
        d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("opacity", 1)
        
        // Update labels
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>${d.name.common}</strong><br>Pop: ${d.population.toLocaleString()}<br>Area: ${d.area.toLocaleString()}km<sup>2</sup>`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        
        
    })
    .on("mouseout", function(event, d) {
        
                d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", 0)
                .attr("opacity", 1)
        tooltip.transition().duration(300).style("opacity", 0);
    });

    // Set up bubble dragging
    const drag = d3.drag()
    .on("start", function (event, d ) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
    })
    .on("drag", function (event, d ) {
        d.fx = event.x
        d.fy = event.y
    })
    .on("end", function (event, d ) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
    })
    node.call(drag)

    // Set up zooming and panning
    const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on('zoom', function(event) {
        container.attr('transform', event.transform)
    })
    svg.call(zoom)

    // update the bubbles 
    function updateBubbles() {
        size = getSizeScale(currentMetric, data)

        node.transition().duration(2000)
        .attr('r', d => size(getMetricValue(d, currentMetric)))

        simulation.force("collision", d3.forceCollide()
        .radius(d => size(getMetricValue(d, currentMetric)) + spacing))
        .force("charge", d3.forceManyBody().strength(5))
        .alpha(1).restart()
    }

    function getMetricValue(d, metric) {
        if (metric === "population") return d.population
        if (metric === "area") return d.area
        return d.population / d.area 
    }

    // Select view
    d3.select("#metric-select").on("change", function() {
        value = d3.select(this).property("value");
        currentMetric = value
        text = d3.select(`#${value}`).html()

        d3.select("#currentMetric").html(text)
        // tooltip.html(`<strong>${d.name.common}</strong><br>Pop: ${d.population.toLocaleString()}<br>Area: ${d.area.toLocaleString()}km<sup>2</sup>`)
        updateBubbles()
    })

}
)
