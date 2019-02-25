// William Skagerström

function newData(data, period){
	$("svg g").children().remove();
  loadData(data);
  document.getElementById("period").innerHTML = period;
  //console.log(data.toString());
}

var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1500 - margin.left - margin.right,
    height = 580 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1);
var y = {};

var z = d3.scale.ordinal() // Color palette
    .range(["#ed00ad",
    "#83e901",
    "#9300bd",
    "#009d14",
    "#f66bff",
    "#00f4a5",
    "#820097",
    "#afbb00",
    "#2e005e",
    "#06ffe7",
    "#e40023",
    "#00bbfd",
    "#ff7004",
    "#007bdd",
    "#cb8500",
    "#9992ff",
    "#043d00",
    "#ff9dfd",
    "#009462",
    "#d6005f",
    "#415500",
    "#ff6bbf",
    "#6f7c3b",
    "#00337a",
    "#ff8450",
    "#ffabe9",
    "#655100",
    "#c06f92",
    "#840033",
    "#cf777f"]);
var dragging = {};

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "countryLabel")
    .text("");

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("body").select(".svg").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function loadData(data_url) {
  d3.csv(data_url, function(error, data) {
    //console.log(data);
    // Extract the list of dimensions and create a scale for each.
    
    x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
      var bounds = d3.extent(data, function(p) { return +p[d]; });
      var maxBound = 100;
      var minBound = 0;

      
      //console.log(bounds)

      //console.log(bounds)



      if(bounds[1] <= 10){
        maxBound = 10;
      }

      if(bounds[0] < 0){
        minBound = -10;
      }


      console.log(bounds);
      return d != "Country" && (y[d] = d3.scale.linear()
          //.domain([0, 100])
          .domain([Math.min(0,minBound), Math.max(maxBound,bounds[1])])
          //.domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([height, 0]));
    }))

    // Add countries to the color (ordinal) scale
    var countries = [];
    data.forEach(
       function(p) {countries.push(p.Country)}
    );
    z.domain(countries);

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("d", path);
        // .on("mouseover", function() {document.getElementById("p2").style.color = "blue";})
        // .on("mouseout", function() {});

    // Add multi-color foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("d", path)
        .attr("stroke", function(d) { return z(d.Country); })
        .on("mouseover", function(d) {
                            tooltip.style("visibility", "visible");
                            return tooltip.text(d.Country);})
        .on("mousemove", function() {return tooltip.style("top",
            (d3.event.pageY+10)+"px").style("left",(d3.event.pageX+15)+"px");})
        .on("mouseout", function() {
                            tooltip.style("visibility", "hidden");
                            return tooltip.text("");});

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
          .origin(function(d) { return {x: x(d)}; })
          .on("dragstart", function(d) {
            dragging[d] = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(width, Math.max(0, d3.event.x));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("dragend", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
              .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
          d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
  });
}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p].replace(',', '.'))]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}