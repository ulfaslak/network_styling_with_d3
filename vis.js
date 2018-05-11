// Based on simple canvas network visualization by Mike Bostock
// source: https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

// State variables
dataset = "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/4cab5036464800e51ce59fc088688e9821795efb/miserables.json"
node_scale = 1;
node_size_logscale = false;
node_stroke_size = 1;
node_color = "#16a085";
node_stroke = "black";
link_distance = 30;
link_weight_logscale = false;
link_width = 1;
link_stroke = "rgb(189, 195, 199)";
link_alpha = 0.8;
collide = false;

// Canvas
var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height;

// Simulation
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) { return computeLinkDistance(d); }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(0))
    .force("x", d3.forceX(width / 2)).force("y", d3.forceY(height / 2));

// Event handlers
d3.select("input[id=dataset]").on("keyup", inputtedDataset);
d3.select("input[id=charge]").on("input", inputtedCharge);
d3.select("input[id=gravity]").on("input", inputtedGravity);
d3.select("input[id=strength]").on("input", inputtedStrength);
d3.select("input[id=distance]").on("input", inputtedDistance);
d3.select("input[id=linkwidth]").on("input", inputtedLinkWidth);
d3.select("input[id=nodesize]").on("input", inputtedNodeSize);
d3.select("input[id=nodestrokesize]").on("input", inputtedNodeStrokeSize);
d3.select("input[id=nodefill]").on("keyup", inputtedNodeFill);
d3.select("input[id=nodestroke]").on("keyup", inputtedNodeStroke);
d3.select("input[id=linkstroke]").on("keyup", inputtedLinkStroke);
d3.select("input[id=linkalpha]").on("input", inputtedLinkAlpha);

// Run simulation
restart();

// Restart simulation. Only used when reloading data
function restart() {
  d3.json(dataset, function(error, graph) {
    if (error) throw error;

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    d3.select(canvas)
        .call(d3.drag()
            .container(canvas)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    function ticked() {
      context.clearRect(0, 0, width, height);

      context.beginPath();
      graph.links.forEach(drawLink);
      context.strokeStyle = link_stroke;
      context.lineWidth = link_width;
      context.globalAlpha = link_alpha;
      context.stroke();

      context.beginPath();
      graph.nodes.forEach(drawNode);
      context.globalAlpha = 1.0
      context.strokeStyle = node_stroke;
      context.lineWidth = node_stroke_size;
      context.stroke();
      context.fillStyle = node_color;
      context.fill();

    }

    function dragsubject() {
      return simulation.find(d3.event.x, d3.event.y);
    }
  }); 
}


// Network functions
// -----------------

function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

function drawLink(d) {
  context.moveTo(d.source.x, d.source.y);
  context.lineTo(d.target.x, d.target.y);
}

function drawNode(d) {
  if (d.size) { 
    thisnodesize = d.size * node_scale;
  } else {
    thisnodesize = node_scale;
  };
  if (node_size_logscale) {
    thisnodesize = logscaler(thisnodesize+1) * node_scale
  }
  context.moveTo(d.x + thisnodesize, d.y);
  context.arc(d.x, d.y, thisnodesize, 0, 2 * Math.PI);
}


// Utility functions
// -----------------

logscaler = d3.scaleLog()

function computeNodeRadii(d) {
  if (d.size) {
    thisnodesize = d.size * node_scale;
  } else {
    thisnodesize = node_scale;
  };
  if (node_size_logscale) {
    thisnodesize = logscaler(thisnodesize + 1) * node_scale;
  }
  return thisnodesize + node_stroke_size;
}

function computeLinkDistance(d) {
  if (d.weight) {
    thislinkweight = 1 / d.weight * link_distance;
  } else {
    thislinkweight = link_distance;
  }
  if (link_weight_logscale) {
    thislinkweight = logscaler(thislinkweight + 1) * link_distance
  }
  return thislinkweight
}

function download(){
  var image = document.getElementById("canvas").toDataURL("image/png").replace("image/png", "image/octet-stream");
  document.getElementById("download").setAttribute("href", image);
}


// Input handling functions
// ------------------------

function inputtedDataset() {
  dataset = this.value;
  restart();
  simulation.alpha(1).restart();
}

function inputtedCharge() {
  simulation.force("charge").strength(+this.value);
  simulation.alpha(1).restart();
}

function inputtedGravity() {
  simulation.force("x").strength(+this.value);
  simulation.force("y").strength(+this.value);
  simulation.alpha(1).restart();
}

function inputtedStrength() {
  simulation.force("link").strength(+this.value);
  simulation.alpha(1).restart();
}

function inputtedDistance() {
  link_distance = +this.value;
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedLinkWidth() {
  link_width = +this.value;
  simulation.restart();
}

function inputtedLinkStroke() {
  link_stroke = this.value;
  simulation.restart();
}

function inputtedLinkAlpha() {
  link_alpha = this.value
  simulation.restart();
}

function inputtedNodeSize() {
  node_scale = +this.value;
  if (collide) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedNodeSizeLogScaling() {
  node_size_logscale = !node_size_logscale
  if (collide) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedLinkWeightLogScaling() {
  link_weight_logscale = !link_weight_logscale
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedNodeStrokeSize() {
  node_stroke_size = +this.value;
  simulation.restart();
}

function inputtedCollision() {
  collide = !collide
  simulation.force("collide").radius(function(d) { return collide * computeNodeRadii(d) });
  simulation.alpha(1).restart();
}

function inputtedNodeFill() {
  node_color = this.value
  simulation.restart();
}

function inputtedNodeStroke() {
  node_stroke = this.value
  simulation.restart();
}