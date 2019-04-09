// Based on simple canvas network visualization by Mike Bostock
// source: https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

// Canvas
//
function vis(new_controls) {
  var canvas = document.querySelector("canvas");
  var parentdiv = document.getElementsByClassName("canvas_container")[0];
  canvas.width = parentdiv.offsetWidth;
  canvas.height = parentdiv.offsetHeight;

  window.onresize = function () {
    canvasOffsetX = canvas.getBoundingClientRect().x;
    canvasOffsetY = canvas.getBoundingClientRect().y;
  }
  window.onresize()

  let maxNodeSize, maxLinkWeight, activeSwatch;
  let context = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;

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
    .force("link", d3.forceLink()
      .id(function (d) { return d.id; })
      .distance(10)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(0).radius(function (d) { return controls['Collision'] * computeNodeRadii(d) }))
    .force("x", d3.forceX(width / 2)).force("y", d3.forceY(height / 2));


  // Download figure function (must be defined before control variables)
  var download = function () {
    var link = document.createElement('a');
    link.download = 'network.png';
    link.href = document.getElementById('canvas').toDataURL();
    link.click();
  }

  // Upload dataset button
  function uploadEvent() {
    var fileInput = document.getElementById('upload');
    fileInput.addEventListener("change", function () {
      var file = fileInput.files[0];
      var reader = new FileReader();

      if (file.name.endsWith(".json")) {
        reader.onload = function (e) {
          restartIfValidJSON(JSON.parse(reader.result));
        }
      } else if (file.name.endsWith(".csv")) {
        reader.onload = function (e) {
          restartIfValidCSV(reader.result)
        }
      } else {
        swal({ text: "File not supported", icon: "error" })
        return false
      }
      reader.readAsText(file);
    });
  }

  var uploadFile = function () {
    var uploader = document.getElementById('upload');
    uploader.click()
    uploadEvent();
  }

  // Control variables
  var controls = {
    'Path to file (csv or json)': "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/0b9595c09b9f70a77ee05ca16d5a8b42a9130c9e/miserables.json",
    'Upload file (csv or json)': uploadFile,
    'Download figure': download,
    'Apply heat (wiggle)': false,
    'Charge strength': -30,
    'Center gravity': 0.1,
    'Link distance': 10,
    'Link width': 5,
    'Link alpha': 0.5,
    'Node size': 10,
    'Node stroke size': 0.5,
    'Node size exponent': 0.5,
    'Link width exponent': 0.5,
    'Collision': false,
    'Node fill': '#16a085',
    'Node stroke': '#000000',
    'Link stroke': '#7c7c7c',
    'Label stroke': '#000000',
    'Show labels': false,
    'Show singleton nodes': false,
    'Node size by strength': false,
    'Zoom': 1.5,
    'Min. link weight %': 0,
    'Max. link weight %': 100,
    'Post to Python': post_data,
  };
  let referenceColor = controls['Node fill'];
    

  Reflect.ownKeys(new_controls).forEach(function (key) {
    controls[key] = new_controls[key];
  });

  // Hack to enable titles (https://stackoverflow.com/a/29563786/3986879)
  var eachController = function (fnc) {
    for (var controllerName in dat.controllers) {
      if (dat.controllers.hasOwnProperty(controllerName)) {
        fnc(dat.controllers[controllerName]);
      }
    }
  }

  var setTitle = function (v) {
    // __li is the root dom element of each controller
    if (v) {
      this.__li.setAttribute('title', v);
    } else {
      this.__li.removeAttribute('title')
    }
    return this;
  };

  eachController(function (controller) {
    if (!controller.prototype.hasOwnProperty('title')) {
      controller.prototype.title = setTitle;
    }
  });

  // Titles
  var title1_1 = "URL of eligible file in either JSON or CSV format"
  var title1_2 = "Upload a network from your computer in either JSON or CSV format"
  var title1_3 = "Download the network as a PNG image"
  var title1_4 = "In case the visualization was started from Python, post all calculated node and link properties back to Python.";
  var title1_5 = "Zoom in or out"
  var title2_1 = "Each node has negative charge and thus repel one another (like electrons). The more negative this charge is, the greater the repulsion"
  var title2_2 = "Push the nodes more or less towards the center of the canvas"
  var title2_3 = "The optimal link distance that the force layout algorithm will try to achieve for each link"
  var title2_5 = "Make it harder for nodes to overlap"
  var title2_5 = "Increase the force layout algorithm temperature to make the nodes wiggle. Useful for big networks that need some time for the nodes to settle in the right positions"
  var title3_1 = 'Node color(s). If nodes have "group" attributes (unless groups are named after colors) each group is given a random color. Changing "Node fill" will continuously change the color of all groups'
  var title3_2 = "The color of the ring around nodes"
  var title3_3 = "The color of node labels"
  var title3_4 = "Whether to show labels or not"
  var title3_5 = "Rescale the size of each node relative to their strength (weighted degree)"
  var title3_6 = "Change the size of all nodes"
  var title3_7 = "Change the width of the ring around nodes"
  var title3_8 = "Tweak the node size scaling function. Increase to make big nodes bigger and small nodes smaller"
  var title4_1 = "The color of links"
  var title4_2 = "Change the width of all links"
  var title4_3 = "How transparent links should be. Useful in large dense networks"
  var title4_4 = "Tweak the link width scaling function. Increase to make wide links wider and narrow links narrower"
  var title5_1 = "Whether or not to show links that have zero degree"
  var title5_2 = "Lower percentile threshold on link weight"
  var title5_3 = "Upper percentile threshold on link weight"

  // Control panel
  var gui = new dat.GUI({ autoPlace: false });
  var customContainer = document.getElementsByClassName('controls_container')[0];
  gui.width = customContainer.offsetWidth;
  gui.closed = false;
  customContainer.appendChild(gui.domElement);
  gui.remember(controls);

  var f1 = gui.addFolder('Input/output'); f1.open();
  f1.add(controls, 'Path to file (csv or json)', controls['Path to file (csv or json)']).onFinishChange(function (v) { handleURL(v) }).title(title1_1);
  f1.add(controls, 'Upload file (csv or json)').title(title1_2);
  f1.add(controls, 'Download figure').title(title1_3);
  f1.add(controls, 'Post to Python').title(title1_4);
  f1.add(controls, 'Zoom', 0.6, 5).onChange(function (v) { inputtedZoom(v) }).title(title1_5);

  var f2 = gui.addFolder('Physics'); f2.open();
  f2.add(controls, 'Charge strength', -100, 0).onChange(function (v) { inputtedCharge(v) }).title(title2_1);
  f2.add(controls, 'Center gravity', 0, 1).onChange(function (v) { inputtedGravity(v) }).title(title2_2);
  f2.add(controls, 'Link distance', 0.1, 50).onChange(function (v) { inputtedDistance(v) }).title(title2_3);
  f2.add(controls, 'Collision', false).onChange(function (v) { inputtedCollision(v) }).title(title2_5);
  f2.add(controls, 'Apply heat (wiggle)', false).onChange(function (v) { inputtedReheat(v) }).title(title2_5);

  var f3 = gui.addFolder('Nodes'); f3.open();
  f3.addColor(controls, 'Node fill', controls['Node fill']).onChange(function (v) { inputtedNodeFill(v) }).title(title3_1);
  f3.addColor(controls, 'Node stroke', controls['Node stroke']).onChange(function (v) { inputtedNodeStroke(v) }).title(title3_2);
  f3.addColor(controls, 'Label stroke', controls['Label stroke']).onChange(function (v) { inputtedTextStroke(v) }).title(title3_3);
  f3.add(controls, 'Show labels', false).onChange(function (v) { inputtedShowLabels(v) }).title(title3_4);
  f3.add(controls, 'Node size by strength', false).onChange(function (v) { inputtedNodeSizeByStrength(v) }).title(title3_5);
  f3.add(controls, 'Node size', 0, 50).onChange(function (v) { inputtedNodeSize(v) }).title(title3_6);
  f3.add(controls, 'Node stroke size', 0, 10).onChange(function (v) { inputtedNodeStrokeSize(v) }).title(title3_7);
  f3.add(controls, 'Node size exponent', 0., 3.).onChange(function (v) { inputtedNodeSizeExponent(v) }).title(title3_8);

  var f4 = gui.addFolder('Links'); f4.open();
  f4.addColor(controls, 'Link stroke', controls['Link stroke']).onChange(function (v) { inputtedLinkStroke(v) }).title(title4_1);
  f4.add(controls, 'Link width', 0.01, 30).onChange(function (v) { inputtedLinkWidth(v) }).title(title4_2);
  f4.add(controls, 'Link alpha', 0, 1).onChange(function (v) { inputtedLinkAlpha(v) }).title(title4_3);
  f4.add(controls, 'Link width exponent', 0., 3.).onChange(function (v) { inputtedLinkWidthExponent(v) }).title(title4_4);

  var f5 = gui.addFolder('Thresholding'); f5.close();
  f5.add(controls, 'Show singleton nodes', false).onChange(function (v) { inputtedShowSingletonNodes(v) }).title(title5_1);
  f5.add(controls, 'Min. link weight %', 0, 99).onChange(function (v) { inputtedMinLinkWeight(v) }).listen().title(title5_2);
  f5.add(controls, 'Max. link weight %', 1, 100).onChange(function (v) { inputtedMaxLinkWeight(v) }).listen().title(title5_3);

  function post_data()
  {
      let nw_prop = get_network_properties();
      let controls_copy = {};
      for (let prop in controls) 
      {
        if (
            (controls.hasOwnProperty(prop))
            &&
            (prop != 'Post to Python')
            &&
            (prop != 'Download figure')
            &&
            (prop != 'Path to file (csv or json)')
            &&
            (prop != 'Upload file (csv or json)')
           )
        {
          controls_copy[prop] = controls[prop];
        }
      }

      post_json(nw_prop, controls_copy, canvas, function(){
          swal({
              //icon: "success",
              text: "Success! Closing in 3 seconds.",
              icon: "success",
              timer: 3000,
              buttons: {
                     // I know this is all mixed up but it's
                     // apparently the only way to tell swal
                     // to do the same thing when "Ok" is pressed
                     // OR the time ran out
                      cancel: {
                        text: "Ok",
                        value: false,
                        visible: true,
                        className: "",
                        closeModal: true,
                      },
                      confirm: {
                        text: "Cancel",
                        value: true,
                        visible: true,
                        className: "",
                        closeModal: true
                      }
                    }

            }).then((willDelete) => {
                if (willDelete) {
                }
                else
                {
                    post_stop();
                }
            });
      });
  }

  // Restart simulation
  function restart() {

    // Start simulation
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

      // draw
      context.clearRect(0, 0, width, height);
      context.strokeStyle = controls['Link stroke'];
      context.globalAlpha = controls['Link alpha'];
      context.globalCompositeOperation = "destination-over";
      graph.links.forEach(drawLink);
      context.globalAlpha = 1.0
      context.strokeStyle = controls['Node stroke'];
      context.lineWidth = controls['Node stroke size'] * controls['Zoom'];
      context.globalCompositeOperation = "source-over";
      graph.nodes.forEach(drawNode);
      graph.nodes.forEach(drawText);
    }

    simulation.alpha(1).restart();
  }

  handleURL(controls['Path to file (csv or json)']);
  uploadEvent();

  // Network functions
  // -----------------

  function dragsubject() {
    return simulation.find(zoomScaler.invert(d3.event.x), zoomScaler.invert(d3.event.y), 20);
  }

  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = zoomScaler.invert(event.clientX - canvasOffsetX);
    d3.event.subject.fy = zoomScaler.invert(event.clientY - canvasOffsetY);
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  function drawLink(d) {
    var thisLinkWidth = (d.weight || 1) ** (controls['Link width exponent']) * linkWidthNorm * controls['Link width'];
    context.beginPath();
    context.moveTo(zoomScaler(d.source.x), zoomScaler(d.source.y));
    context.lineTo(zoomScaler(d.target.x), zoomScaler(d.target.y));
    context.lineWidth = thisLinkWidth * controls['Zoom'];
    context.stroke();
  }

  function drawNode(d) {
    // Node
    var thisNodeSize = (d.size || 1) ** (controls['Node size exponent']) * nodeSizeNorm * controls['Node size'];
    context.beginPath();
    context.moveTo(zoomScaler(d.x) + thisNodeSize * (controls['Zoom'] + (controls['Zoom'] - 1)), zoomScaler(d.y));
    context.arc(zoomScaler(d.x), zoomScaler(d.y), thisNodeSize * (controls['Zoom'] + (controls['Zoom'] - 1)), 0, 2 * Math.PI);
    context.fillStyle = computeNodeColor(d);
    context.fill();
    context.stroke();
  }

  function drawText(d) {
    if (controls['Show labels'] || d.id == hoveredNode || selectedNodes.includes(d.id)) {
      var thisNodeSize = (d.size || 1) ** (controls['Node size exponent']) * nodeSizeNorm * controls['Node size'];
      context.font = clip(thisNodeSize * controls['Zoom'] * 2, 10, 20) + "px Helvetica"
      context.fillStyle = controls['Label stroke']
      context.fillText(d.id, zoomScaler(d.x), zoomScaler(d.y))
    }
  }


  // Utility functions
  // -----------------

  logscaler = d3.scaleLog()
  zoomScaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])

  function computeNodeRadii(d) {
    var thisNodeSize = nodeSizeNorm * controls['Node size'];
    if (d.size) {
      thisNodeSize *= (d.size) ** (controls['Node size exponent']);
    }
    return thisNodeSize
  }

  function computeNodeColor(d) {
    if (d.group) {
      return activeSwatch[d.group]
    } else {
      return controls['Node fill']
    }
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

  function inputtedDistance(v) {
    simulation.force("link").distance(controls['Link distance']);
    simulation.alpha(1).restart();
  }

  function inputtedCollision(v) {
    simulation.force("collide").radius(function (d) { return controls['Collision'] * computeNodeRadii(d) });
    simulation.alpha(1).restart();
  }

  function inputtedReheat(v) {
    simulation.alpha(0.5);
    simulation.alphaTarget(v).restart();
  }


  // Styling
  function inputtedNodeFill(v) {
    window.dr = parseInt(v.slice(1, 3), 16) - parseInt(referenceColor.slice(1, 3), 16)
    window.dg = parseInt(v.slice(3, 5), 16) - parseInt(referenceColor.slice(3, 5), 16)
    window.db = parseInt(v.slice(5, 7), 16) - parseInt(referenceColor.slice(5, 7), 16)
    for (var g of d3.keys(activeSwatch)) {
      var r_ = bounceModulus(parseInt(referenceSwatch[g].slice(1, 3), 16) + dr, 0, 255);
      var g_ = bounceModulus(parseInt(referenceSwatch[g].slice(3, 5), 16) + dg, 0, 255);
      var b_ = bounceModulus(parseInt(referenceSwatch[g].slice(5, 7), 16) + db, 0, 255);
      activeSwatch[g] = '#' + toHex(r_) + toHex(g_) + toHex(b_);
    }
    simulation.restart();
  }

  function inputtedNodeStroke(v) {
    simulation.restart();
  }

  function inputtedLinkStroke(v) {
    simulation.restart();
  }

  function inputtedTextStroke(v) {
    simulation.restart();
  }

  function inputtedShowLabels(v) {
    simulation.restart();
  }

  function inputtedShowSingletonNodes(v) {
    if (v) {
      graph['nodes'].push(...negativeGraph.nodes)
      negativeGraph['nodes'] = []
    } else if (!v) {
      graph['nodes'] = graph.nodes.filter(n => {
        var keepNode = nodeStrengths[n.id] > 0
        if (!keepNode) negativeGraph['nodes'].push(n);
        return keepNode;
      })
    }
    restart();
    simulation.restart();
  }

  function inputtedNodeSizeByStrength(v) {
    if (v) {
      graph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
      negativeGraph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
    } else if (!v) {
      graph.nodes.forEach(n => { n.size = findNode(masterGraph, n).size || 1 })
      negativeGraph.nodes.forEach(n => { n.size = findNode(masterGraph, n).size || 1 })
    }
    recomputeNodeNorms()
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
      simulation.force("collide").radius(function (d) { return computeNodeRadii(d) })
      simulation.alpha(1).restart();
    } else {
      simulation.restart();
    }
  }

  function inputtedNodeStrokeSize(v) {
    simulation.restart();
  }

  function inputtedNodeSizeExponent(v) {
    nodeSizeNorm = 1 / maxNodeSize ** (controls['Node size exponent'])
    if (controls['Collision']) {
      simulation.force("collide").radius(function (d) { return computeNodeRadii(d) })
      simulation.alpha(1).restart();
    } else {
      simulation.restart();
    }
  }

  function inputtedLinkWidthExponent(v) {
    linkWidthNorm = 1 / maxLinkWeight ** (controls['Link width exponent'])
    simulation.restart();
  }

  function inputtedZoom(v) {
    zoomScaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])
    simulation.restart();
  }

  var vMinPrev = 0;
  var dvMin = 0;
  function inputtedMinLinkWeight(v) {
    dvMin = v - vMinPrev
    if (shiftDown) {
      controls['Max. link weight %'] = d3.min([100, controls['Max. link weight %'] + dvMin])
    } else {
      controls['Max. link weight %'] = d3.max([controls['Max. link weight %'], v + 1])
    }
    dvMax = controls['Max. link weight %'] - vMaxPrev
    vMinPrev = v
    vMaxPrev = controls['Max. link weight %']
    shave(); restart();
  }

  var vMaxPrev = 100;
  var dvMax = 0;
  function inputtedMaxLinkWeight(v) {
    dvMax = v - vMaxPrev
    if (shiftDown) {
      controls['Min. link weight %'] = d3.max([0, controls['Min. link weight %'] + dvMax])
    } else {
      controls['Min. link weight %'] = d3.min([controls['Min. link weight %'], v - 1])
    }
    dvMin = controls['Min. link weight %'] - vMinPrev
    vMinPrev = controls['Min. link weight %']
    vMaxPrev = v
    shave(); restart();
  }


  // Handle input data
  // -----------------
  function handleURL() {
    if (controls['Path to file (csv or json)'].endsWith(".json")) {
      d3.json(controls['Path to file (csv or json)'], function (error, _graph) {
        if (error) {
          swal({ text: "File not found", icon: "error" })
          return false
        }
        restartIfValidJSON(_graph);
      })
    } else if (controls['Path to file (csv or json)'].endsWith(".csv")) {
      try {
        fetch(controls['Path to file (csv or json)']).then(r => r.text()).then(r => restartIfValidCSV(r));
      } catch (error) {
        throw error;
        swal({ text: "File not found", icon: "error" })
      }
    }
  }


  function restartIfValidJSON(masterGraph) {

    // Check for 'nodes' and 'links' lists
    if (!masterGraph.nodes || masterGraph.nodes.length == 0) {
      swal({ text: "Dataset does not have a key 'nodes'", icon: "error" })
      return false
    }
    if (!masterGraph.links) {
      swal({ text: "Dataset does not have a key 'links'", icon: "warning" })
    }

    // Check that node and link objects are formatted right
    for (var d of masterGraph.nodes) {
      if (!d3.keys(d).includes("id")) {
        swal({ text: "Found objects in 'nodes' without 'id' key.", icon: "error" });
        return false;
      }
    }
    for (var d of masterGraph.links) {
      if (!d3.keys(d).includes("source") || !d3.keys(d).includes("target")) {
        swal({ text: "Found objects in 'links' without 'source' or 'target' key.", icon: "error" });
        return false;
      }
    }

    // Check that 'links' and 'nodes' data are congruent
    var nodesNodes = masterGraph.nodes.map(d => { return d.id });
    var nodesNodesSet = new Set(nodesNodes)
    var linksNodesSet = new Set()
    masterGraph.links.forEach(l => {
      linksNodesSet.add(l.source); linksNodesSet.add(l.source.id)  // Either l.source or l.source.id will be null
      linksNodesSet.add(l.target); linksNodesSet.add(l.target.id)  // so just add both and remove null later (same for target)
    }); linksNodesSet.delete(undefined)

    if (nodesNodesSet.size == 0) {
      swal({ text: "No nodes found.", icon: "error" })
      return false;
    }
    if (nodesNodes.includes(null)) {
      swal({ text: "Found items in node list without 'id' key.", icon: "error" });
      return false;
    }
    if (nodesNodes.length != nodesNodesSet.size) {
      swal({ text: "Found multiple nodes with the same id.", icon: "error" });
      return false;
    }
    if (nodesNodesSet.size < linksNodesSet.size) {
      swal({ text: "Found nodes referenced in 'links' which are not in 'nodes'.", icon: "error" });
      return false;
    }

    // Check that attributes are indicated consistently in both nodes and links
    var countWeight = masterGraph.links.filter(n => { return 'weight' in n }).length
    if (0 < countWeight & countWeight < masterGraph.links.length) {
      swal({ text: "Found links with and links without 'weight' attribute", icon: "error" });
      return false;
    } else if (countWeight == 0) {
      masterGraph.links.forEach(l => { l.weight = 1; })
    }
    var countGroup = masterGraph.nodes.filter(n => { return 'group' in n }).length
    if (0 < countGroup & countGroup < masterGraph.nodes.length) {
      swal({ text: "Found nodes with and nodes without 'group' attribute", icon: "error" });
      return false;
    }
    countSize = masterGraph.nodes.filter(n => { return 'size' in n }).length
    if (0 < countSize & countSize < masterGraph.nodes.length) {
      swal({ text: "Found nodes with and nodes without 'size' attribute", icon: "error" });
      return false;
    }
    else if (countSize == 0) {
      masterGraph.nodes.forEach(n => { n.size = 1; })
    }

    // Check for foreign node and link attributes
    var foreignNodesAttributes = new Set()
    masterGraph.nodes.forEach(d => {
      d3.keys(d).forEach(k => {
        if (!['id', 'size', 'group'].includes(k)) foreignNodesAttributes.add(k)
      })
    })
    var foreignLinksAttributes = new Set()
    masterGraph.links.forEach(d => {
      d3.keys(d).forEach(k => {
        if (!['source', 'target', 'weight'].includes(k)) foreignLinksAttributes.add(k)
      })
    })
    if (foreignNodesAttributes.size > 0) {
      swal({ text: "Found unexpected node attribute(s): " + Array.from(foreignNodesAttributes).join(", "), icon: "warning" })
    }
    if (foreignLinksAttributes.size > 0) {
      swal({ text: "Found unexpected link attribute(s): " + Array.from(foreignLinksAttributes).join(", "), icon: "warning" })
    }

    // Reference graph (is never changed)
    window.masterGraph = masterGraph

    // Size and weight norms, colors and degrees
    computeMasterGraphGlobals();

    // Active graph that d3 operates on
    window.graph = _.cloneDeep(masterGraph)

    // If 'Node size by strength' is toggled, then node sizes need to follow computed degrees
    if (controls['Node size by strength']) {
      graph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
    }

    // Container for part of the network which are not in `graph` (for faster thresholding)
    window.negativeGraph = { 'nodes': [], 'links': [] }

    // Reset all thresholds ...
    controls["Min. link weight %"] = 0
    controls["Max. link weight %"] = 100

    // Run the restart if all of this was OK
    restart();
  }


  function restartIfValidCSV(rawInput) {
    // Assume header is "source,target(,weight)"
    var nodes = new Set();
    var links = d3.csvParse(rawInput).map(l => {
      nodes.add(l.source); nodes.add(l.target);
      return { 'source': l.source, 'target': l.target, 'weight': +valIfValid(l.weight, 1) }
    })

    // Warn against zero links
    var zeroLinksCount = 0
    links = links.filter(l => {
      if (l.weight == 0) {
        zeroLinksCount += 1;
      } else {
        return l;
      }
    })

    if (zeroLinksCount > 0) {
      swal({ text: "Removed " + zeroLinksCount + " links with weight 0", icon: "warning" })
    }

    // Reference graph (is never changed)
    window.masterGraph = {
      'nodes': Array.from(nodes).map(n => { return { 'id': n, 'size': 1 } }),
      'links': links
    }

    // Size and weight norms, colors and degrees
    computeMasterGraphGlobals();

    // Active graph that d3 operates on
    window.graph = _.cloneDeep(masterGraph)

    // If 'Node size by strength' is toggled, then node sizes need to follow computed degrees
    if (controls['Node size by strength']) {
      graph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
    }

    // Container for part of the network which are not in `graph` (for faster thresholding)
    window.negativeGraph = { 'nodes': [], 'links': [] }

    // Reset all thresholds ...
    controls["Min. link weight %"] = 0
    controls["Max. link weight %"] = 100

    restart();
  }

  // Various utilities
  // -----------------

  function findNode(_graph, n) {
    for (let _n of _graph.nodes) {
      if (_n.id == (n.id || n)) {
        return _n;
      }
    }
    return undefined;
  }

  function findLink(_graph, l) {
    for (let _l of _graph.links) {
      if (_l.source.id == l.source && _l.target.id == l.target) {
        return _l;
      }
    }
    return undefined;
  }

  function computeMasterGraphGlobals() {

    // Sort out node colors
    var nodeGroups = new Set(masterGraph.nodes.filter(n => 'group' in n).map(n => { return n.group }))
    activeSwatch = {};
    for (let g of nodeGroups) {
      if (validColor(g)) {
        activeSwatch[g] = getHexColor(g);
      } else {
        activeSwatch[g] = '#' + Math.floor(Math.random() * 16777215).toString(16);
      }
    }
    window.referenceSwatch = _.cloneDeep(activeSwatch)

    // Immutable node degree (unless strength is toggled)
    masterNodeStrengths = {}; masterGraph.nodes.map(n => masterNodeStrengths[n.id] = 0)
    masterNodeDegrees = {}; masterGraph.nodes.map(n => masterNodeDegrees[n.id] = 0)
    masterGraph.links.forEach(l => {
      masterNodeStrengths[l.source] += l.weight || 1;
      masterNodeStrengths[l.target] += l.weight || 1;
      masterNodeDegrees[l.source] += 1;
      masterNodeDegrees[l.target] += 1;
    });

    // Degree dicrionary to keep track of ACTIVE degrees after thresholds are applied
    nodeStrengths = _.cloneDeep(masterNodeStrengths)

    // Compute node size and link width norms
    recomputeNodeNorms()
    recomputeLinkNorms()
  }

  function recomputeNodeNorms() {
    // Compute node size norms
    if (controls['Node size by strength']) {
      maxNodeSize = d3.max(d3.values(masterNodeStrengths))
    } else {
      maxNodeSize = d3.max(masterGraph.nodes.map(n => n.size || 0));  // Nodes are given size if they don't have size on load
    }
    nodeSizeNorm = 1 / maxNodeSize ** (controls['Node size exponent'])
  }

  function recomputeLinkNorms() {
    maxLinkWeight = d3.max(masterGraph.links.map(l => l.weight || 0));
    minLinkWeight = d3.min(masterGraph.links.map(l => l.weight || 1));
    linkWidthNorm = 1 / maxLinkWeight ** (controls['Link width exponent'])
  }


  // pass the new values to the simulation
  Reflect.ownKeys(new_controls).forEach(function (key) {

    let v = new_controls[key];

    if (key == 'Charge strength') inputtedCharge(v);
    if (key == 'Center gravity') inputtedGravity(v);
    if (key == 'Link distance') inputtedDistance(v);
    if (key == 'Link strength exponent') inputtedLinkStrengthExponent(v);
    if (key == 'Collision') inputtedCollision(v);

    if (key == 'Node fill') inputtedNodeFill(v);
    if (key == 'Node stroke') inputtedNodeStroke(v);
    if (key == 'Link stroke') inputtedLinkStroke(v);
    if (key == 'Label stroke') inputtedTextStroke(v);
    if (key == 'Show labels') inputtedShowLabels(v);
    if (key == 'Link width') inputtedLinkWidth(v);
    if (key == 'Link alpha') inputtedLinkAlpha(v);
    if (key == 'Node size') inputtedNodeSize(v);
    if (key == 'Node stroke size') inputtedNodeStrokeSize(v);
    if (key == 'Node size exponent') inputtedNodeSizeExponent(v);
    if (key == 'Link width exponent') inputtedLinkWidthExponent(v);
    if (key == 'Zoom') inputtedZoom(v);
  });

  // Control panel	   



  function shave() {
    // Compute what number a percentage corresponds to
    var intervalRange = function (percent) {
      return percent / 100 * (maxLinkWeight - minLinkWeight) + minLinkWeight
    }

    // MIN SLIDER MOVES RIGHT or MAX SLIDER MOVES LEFT
    if (dvMin > 0 || dvMax < 0) {

      // Remove links and update `nodeStrengths
      graph['links'] = graph.links.filter(l => {
        var withinThreshold = (intervalRange(controls['Min. link weight %']) <= l.weight) && (l.weight <= intervalRange(controls['Max. link weight %']))
        if (!withinThreshold) {
          nodeStrengths[l.source.id] -= l.weight || 1;
          nodeStrengths[l.target.id] -= l.weight || 1;
          negativeGraph.links.push(l);
        }
        return withinThreshold
      })

      // Remove singleton nodes
      if (!controls['Show singleton nodes']) {
        graph['nodes'] = graph.nodes.filter(n => {
          var keepNode = nodeStrengths[n.id] > 0;
          if (!keepNode) {
            negativeGraph.nodes.push(n)
          }
          return keepNode;
        })
      }

      // Resize nodes
      if (controls['Node size by strength']) {
        graph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
        negativeGraph.nodes.forEach(n => { n.size = nodeStrengths[n.id] })
      }
    }

    // MIN SLIDER MOVES LEFT or MAX SLIDER MOVES RIGHT
    if (dvMin < 0 || dvMax > 0) {

      // Add links back and update `nodeStrengths`
      negativeGraph['links'] = negativeGraph.links.filter(l => {
        var withinThreshold = (intervalRange(controls['Min. link weight %']) <= l.weight) && (l.weight <= intervalRange(controls['Max. link weight %']))
        if (withinThreshold) {
          nodeStrengths[l.source.id] += l.weight || 1;
          nodeStrengths[l.target.id] += l.weight || 1;
          graph['links'].push(l)
        }
        return !withinThreshold
      })

      // Add nodes back
      if (!controls['Show singleton nodes']) {
        negativeGraph['nodes'] = negativeGraph.nodes.filter(n => {
          var keepNode = nodeStrengths[n.id] > 0;
          if (keepNode) {
            graph['nodes'].push(n)
          }
          return !keepNode;
        })
      }

      // Resize nodes
      if (controls['Node size by strength']) {
        graph.nodes.forEach(n => {
          n.size = nodeStrengths[n.id]
        })
      }
    }
  }

  // Utility functions
  function Counter(array) {
    var count = {};
    array.forEach(val => count[val] = (count[val] || 0) + 1);
    return count;
  }

  class DefaultDict {
    constructor(defaultInit) {
      return new Proxy({}, {
        get: (target, name) => name in target ?
          target[name] :
          (target[name] = typeof defaultInit === 'function' ?
            new defaultInit().valueOf() :
            defaultInit)
      })
    }
  }

  function bounceModulus(v, lower, upper) {
    if (lower <= v & v <= upper) {
      return v;
    }
    if (v < lower) {
      return bounceModulus(lower + (lower - v), lower, upper);
    }
    if (v > upper) {
      return bounceModulus(upper - (v - upper), lower, upper);
    }
  }

  function toHex(v) {
    var hv = v.toString(16)
    if (hv.length == 1) hv = "0" + hv;
    return hv;
  }

  function validColor(stringToTest) {
    // https://stackoverflow.com/a/16994164/3986879
    var image = document.createElement("img");
    image.style.color = "rgb(0, 0, 0)";
    image.style.color = stringToTest;
    if (image.style.color !== "rgb(0, 0, 0)") { return true; }
    image.style.color = "rgb(255, 255, 255)";
    image.style.color = stringToTest;
    return image.style.color !== "rgb(255, 255, 255)";
  }

  function getHexColor(colorStr) {
    /// https://stackoverflow.com/a/24366628/3986879
    var a = document.createElement('div');
    a.style.color = colorStr;
    var colors = window.getComputedStyle(document.body.appendChild(a)).color.match(/\d+/g).map(function (a) { return parseInt(a, 10); });
    document.body.removeChild(a);
    return (colors.length >= 3) ? '#' + (((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).substr(1)) : false;
  }

  function clip(val, lower, upper) {
    if (val < lower) {
      return lower
    } else if (val > upper) {
      return upper
    } else {
      return val
    }
  }

  function valIfValid(v, alt) {
    if (isNaN(+v)) { return alt; }
    else { return v; }
  }

  // Handle key events //
  // ----------------- // 
  var shiftDown = false
  window.onkeydown = function () {
    if (window.event.keyCode == 16) {
      shiftDown = true;
    }
  }
  window.onkeyup = function () {
    shiftDown = false;
  }

  var hoveredNode;
  var selectedNodes = [];
  var xy;
  d3.select(canvas).on("mousemove", function () {
    if (!controls['Show labels']) {
      xy = d3.mouse(this)
      hoveredNode = simulation.find(zoomScaler.invert(xy[0]), zoomScaler.invert(xy[1]), 20)
      if (typeof (hoveredNode) != 'undefined') {
        hoveredNode = hoveredNode.id;
      }
      simulation.restart();
    }
  })

  window.addEventListener("mousedown", function () {
    if (typeof (hoveredNode) != 'undefined') {
      if (selectedNodes.includes(hoveredNode)) {
        selectedNodes.splice(selectedNodes.indexOf(hoveredNode), 1)
      } else {
        selectedNodes.push(hoveredNode)
      }
      simulation.restart();
    }
  }, true)


  // Get a JSON object containing all the drawn properties for replication
  function get_network_properties()
  {
      // save all those things we wish to draw to a dict;
      let network_properties = {};
      network_properties.xlim = [ 0, width ];
      network_properties.ylim = [ 0, height ];
      network_properties.linkColor = controls['Link stroke'];
      network_properties.linkAlpha = controls['Link alpha'];
      network_properties.nodeStrokeColor = controls['Node stroke'];
      network_properties.nodeStrokeWidth = controls['Node stroke size'] * controls['Zoom'];
      network_properties.links = [];
      network_properties.nodes = [];

      graph.links.forEach(function(d){
          let thisLinkWidth = (d.weight || 1) ** (controls['Link width exponent']) 
                              * linkWidthNorm 
                              * controls['Link width']
                              * controls['Zoom'];
          network_properties.links.push({ link: [d.source.id, d.target.id], width: thisLinkWidth });
      });
      graph.nodes.forEach(function(d){
          let thisNodeSize = (d.size || 1) ** (controls['Node size exponent']) 
                              * nodeSizeNorm 
                              * controls['Node size']
                              * (2*controls['Zoom']-1);
          network_properties.nodes.push({ id: d.id, pos: [zoomScaler(d.x), height-zoomScaler(d.y)], 
                                          radius: thisNodeSize, color : computeNodeColor(d) });
      });

      return network_properties;
  }
}
