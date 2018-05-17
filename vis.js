// Based on simple canvas network visualization by Mike Bostock
// source: https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

// Canvas
var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d"),
    width = canvas.width
    height = canvas.height

// Retina canvas rendering    
var devicePixelRatio = window.devicePixelRatio || 1
d3.select(canvas)
    .attr("width", width * devicePixelRatio)
    .attr("height", height * devicePixelRatio)
    .style("width", width + "px")
    .style("height", height + "px").node()
context.scale(devicePixelRatio, devicePixelRatio)

// Simulation
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) { return computeLinkDistance(d); }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(0))
    .force("x", d3.forceX(width / 2)).force("y", d3.forceY(height / 2));

// Download figure function (must be defined before control variables)
var download = function() {
  var link = document.createElement('a');
  link.download = 'network.png';
  link.href = document.getElementById('canvas').toDataURL()
  link.click();
}

// Control variables
var controls = {
  'Path to JSON': "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/4cab5036464800e51ce59fc088688e9821795efb/miserables.json",
  'Download figure': download,
  'Charge strength': -30,
  'Center gravity': 0.1,
  'Link strength': 0.5,
  'Link distance': 30,
  'Link width': 1,
  'Link alpha': 0.5,
  'Node size': 10, 
  'Node stroke size': 0.1,
  'Node scaling exponent': 0.5,
  'Link scaling exponent': 1,
  'Collision': false,
  'Node fill': '#16a085',
  'Node stroke': '#000000',
  'Link stroke': '#7c7c7c',
  'Zoom': 1
};


// Control panel
var gui = new dat.GUI(); gui.width = 400; gui.remember(controls);

var f1 = gui.addFolder('Input/output'); f1.open();
f1.add(controls, 'Path to JSON', controls['Path to JSON']).onFinishChange(function(v) { handle_URL_JSON(v) });
tmp = f1.add(controls, 'Download figure');

var f2 = gui.addFolder('Physics'); f2.open();
f2.add(controls, 'Charge strength', -100, 0).onChange(function(v) { inputtedCharge(v) });
f2.add(controls, 'Center gravity', 0, 1).onChange(function(v) { inputtedGravity(v) });
f2.add(controls, 'Link strength', 0, 2).onChange(function(v) { inputtedStrength(v) });
f2.add(controls, 'Link distance', 0.1, 100).onChange(function(v) { inputtedDistance(v) });
f2.add(controls, 'Collision', false).onChange(function(v) { inputtedCollision(v) });

var f3 = gui.addFolder('Styling'); f3.open();
f3.addColor(controls, 'Node fill', controls['Node fill']).onChange(function(v) { inputtedNodeFill(v) });
f3.addColor(controls, 'Node stroke', controls['Node stroke']).onChange(function(v) { inputtedNodeStroke(v) });
f3.addColor(controls, 'Link stroke', controls['Link stroke']).onChange(function(v) { inputtedLinkStroke(v) });
f3.add(controls, 'Link width', 0.1, 10).onChange(function(v) { inputtedLinkWidth(v) });
f3.add(controls, 'Link alpha', 0, 1).onChange(function(v) { inputtedLinkAlpha(v) });
f3.add(controls, 'Node size', 0, 50).onChange(function(v) { inputtedNodeSize(v) });
f3.add(controls, 'Node stroke size', 0, 10).onChange(function(v) { inputtedNodeStrokeSize(v) });
f3.add(controls, 'Node scaling exponent', -1., 1.).onChange(function(v) { inputtedNodeScalingRoot(v) });
f3.add(controls, 'Link scaling exponent', -1., 1.).onChange(function(v) { inputtedLinkScalingRoot(v) });
f3.add(controls, 'Zoom', 0.6, 3).onChange(function(v) { inputtedZoom(v) });


// Restart simulation. Only used when reloading data
function restart(graph) {
  max_node_size = d3.max(graph.nodes.map(n => { if (n.size) { return n.size } else return 0; }));
  min_node_size = d3.min(graph.nodes.map(n => { if (n.size) { return n.size } else return 1; }));
  if (controls['Node scaling exponent'] > 0) {
    node_size_norm = 1 / max_node_size**(controls['Node scaling exponent'])
  } else {
    node_size_norm = 1 / min_node_size**(controls['Node scaling exponent'])
  }

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
    context.strokeStyle = controls['Link stroke'];
    context.lineWidth = controls['Link width'] * (controls['Zoom'] + (controls['Zoom'] - 1));
    context.globalAlpha = controls['Link alpha'];
    context.stroke();

    context.beginPath();
    graph.nodes.forEach(drawNode);
    context.globalAlpha = 1.0
    context.strokeStyle = controls['Node stroke'];
    context.lineWidth = controls['Node stroke size'] * controls['Zoom'];
    context.stroke();
    context.fillStyle = controls['Node fill'];
    context.fill();
  }

  simulation.alpha(1).restart();

}

handle_URL_JSON(controls['Path to JSON'])


// Network functions
// -----------------

function dragsubject() {
  return simulation.find(zoom_scaler.invert(d3.event.x), zoom_scaler.invert(d3.event.y));
}

function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}


function dragged() {
  d3.event.subject.fx = zoom_scaler.invert(event.clientX);
  d3.event.subject.fy = zoom_scaler.invert(event.clientY);
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

function drawLink(d) {
  context.moveTo(zoom_scaler(d.source.x), zoom_scaler(d.source.y));
  context.lineTo(zoom_scaler(d.target.x), zoom_scaler(d.target.y));
}

function drawNode(d) {
  if (d.size) { 
    thisnodesize = (d.size)**(controls['Node scaling exponent']) * node_size_norm * controls['Node size'];
  } else {
    thisnodesize = 1 * node_size_norm * controls['Node size'];
  };
  context.moveTo(zoom_scaler(d.x) + thisnodesize * (controls['Zoom'] + (controls['Zoom'] - 1)), zoom_scaler(d.y));
  context.arc(zoom_scaler(d.x), zoom_scaler(d.y), thisnodesize * (controls['Zoom'] + (controls['Zoom'] - 1)), 0, 2 * Math.PI);
}


// Utility functions
// -----------------

logscaler = d3.scaleLog()
zoom_scaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])

function computeNodeRadii(d) {
  if (d.size) {
    thisnodesize = (d.size)**(controls['Node scaling exponent']) * node_size_norm * controls['Node size'];
  } else {
    thisnodesize = 1 * node_size_norm * controls['Node size'];
  };
  return thisnodesize;
}

function computeLinkDistance(d) {
  if (d.weight) {
    thislinkweight = 1 / d.weight**(controls['Link scaling exponent']) * controls['Link distance'];
  } else {
    thislinkweight = controls['Link distance'];
  }
  return thislinkweight
}

// Input handling functions
// ------------------------

// Physics
function inputtedCharge(v) {
  simulation.force("charge").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedGravity(v) {
  simulation.force("x").strength(+v);
  simulation.force("y").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedStrength(v) {
  simulation.force("link").strength(+v);
  simulation.alpha(1).restart();
}

function inputtedDistance(v) {
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedCollision(v) {
  simulation.force("collide").radius(function(d) { return controls['Collision'] * computeNodeRadii(d) });
  simulation.alpha(1).restart();
}


// Styling
function inputtedNodeFill(v) {
  simulation.restart();
}

function inputtedNodeStroke(v) {
  simulation.restart();
}

function inputtedLinkStroke(v) {
  simulation.restart();
}

function inputtedLinkWidth(v) {
  simulation.restart();
}

function inputtedLinkAlpha(v) {
  simulation.restart();
}

function inputtedNodeSize(v) {
  if (controls['Collision']) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedNodeStrokeSize(v) {
  simulation.restart();
}

function inputtedNodeScalingRoot(v) {
  if (controls['Node scaling exponent'] > 0) {
    node_size_norm = 1 / max_node_size**(controls['Node scaling exponent'])
  } else {
    node_size_norm = 1 / min_node_size**(controls['Node scaling exponent'])
  }
  if (controls['Collision']) {
    simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
    simulation.alpha(1).restart();
  } else {
    simulation.restart();
  }
}

function inputtedLinkScalingRoot(v) {
  simulation.force("link").distance(function(d) { return computeLinkDistance(d); });
  simulation.alpha(1).restart();
}

function inputtedZoom(v) {
  zoom_scaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])
  simulation.restart();
}


// Handle input data
// -----------------

function handle_URL_JSON() {
  d3.json(controls['Path to JSON'], function(error, graph) {
    if (error) {
      swal({text: "File not found", icon: "error"})
      return false
    }
    restart_if_valid(graph);
  })
}


function restart_if_valid(graph) {
// Check for 'nodes' and 'links' lists
    if (!graph.nodes || graph.nodes.length == 0) {
      swal({text: "Dataset does not have a key 'nodes'", icon: "error"})
      return false
    }
    if (!graph.links) {
      swal({text: "Dataset does not have a key 'links'", icon: "warning"})
    }

    // Check that node and link objects are formatted right
    for (d of graph.nodes) {
      if (!d3.keys(d).includes("id")) {
        swal({text: "Found objects in 'nodes' without 'id' key.", icon: "error"});
        return false;
      }
    }
    for (d of graph.links) {
      if (!d3.keys(d).includes("source") || !d3.keys(d).includes("target")) {
        swal({text: "Found objects in 'links' without 'source' or 'target' key.", icon: "error"});
        return false;
      }
    }

    // Check that 'links' and 'nodes' data are congruent
    var nodes_nodes = graph.nodes.map(d => {return d.id});
    var nodes_nodes_set = new Set(nodes_nodes)
    var links_nodes_set = new Set()
    graph.links.forEach(l => {
      links_nodes_set.add(l.source); links_nodes_set.add(l.source.id)  // Either l.source or l.source.id will be null
      links_nodes_set.add(l.target); links_nodes_set.add(l.target.id)  // so just add both and remove null later (same for target)
    }); links_nodes_set.delete(undefined)

    if (nodes_nodes_set.size == 0) {
      swal({text: "No nodes found.", icon: "error"})
      return false;
    }
    if (nodes_nodes.includes(null)) {
      swal({text: "Found items in node list without 'id' key.", icon: "error"});
      return false;
    }
    if (nodes_nodes.length != nodes_nodes_set.size) {
      swal({text: "Found multiple nodes with the same id.", icon: "error"});
      return false;
    }
    if (nodes_nodes_set.size < links_nodes_set.size) {
      swal({text: "Found nodes referenced in 'links' which are not in 'nodes'.", icon: "error"});
      return false;
    }

    // Check the node and link attributes
    var foreign_nodes_attributes = new Set()
    graph.nodes.forEach(d => {
      d3.keys(d).forEach(k => {
        if (!['id', 'size'].includes(k)) foreign_nodes_attributes.add(k)
      })
    })
    var foreign_links_attributes = new Set()
    graph.links.forEach(d => {
      d3.keys(d).forEach(k => {
        if (!['source', 'target', 'weight'].includes(k)) foreign_links_attributes.add(k)
      })
    })
    if (foreign_nodes_attributes.size > 0) {
      swal({text: "Found unexpected node attribute(s): " + Array.from(foreign_nodes_attributes).join(", "), icon: "warning"})
    }
    if (foreign_links_attributes.size > 0) {
      swal({text: "Found unexpected link attribute(s): " + Array.from(foreign_links_attributes).join(", "), icon: "warning"})
    }

    // Run the restart if all of this was OK
    restart(graph);
}


// Various utilities
// -----------------

