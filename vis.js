function vis(new_controls) {
    // Based on simple canvas network visualization by Mike Bostock
    // source: https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048

    // Canvas
    canvas = document.querySelector("canvas")
    var parentdiv = document.getElementsByClassName("canvas_container")[0]
    canvas.width = parentdiv.offsetWidth
    canvas.height = parentdiv.offsetHeight

    window.onresize = function () {
      canvas_offset_x = canvas.getBoundingClientRect().x
      canvas_offset_y = canvas.getBoundingClientRect().y
    }
    window.onresize()

    context = canvas.getContext("2d")
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
        .force("link", d3.forceLink()
          .id(function(d) { return d.id; })
          .distance(10)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3. forceCollide(0).radius(function(d) { return controls['Collision'] * computeNodeRadii(d) }))
        .force("x", d3.forceX(width / 2)).force("y", d3.forceY(height / 2));

    // Download figure function (must be defined before control variables)
    var download = function() {
      var link = document.createElement('a');
      link.download = 'network.png';
      link.href = document.getElementById('canvas').toDataURL()
      link.click();
    }

    // Upload dataset button
    function upload_event() {
      var fileInput = document.getElementById('upload');
      fileInput.addEventListener("change", function() {
        var file = fileInput.files[0];
        var reader = new FileReader();
        
        if (file.name.endsWith(".json")) {
          reader.onload = function(e) {
            var graph = JSON.parse(reader.result);
            restart_if_valid_JSON(graph);
          }
        } else if (file.name.endsWith(".csv")) {
          reader.onload = function(e) {
            restart_if_valid_CSV(reader.result)
          }
        } else {
          swal({text: "File not supported", icon: "error"})
          return false
        }
        reader.readAsText(file);
      });
    }

    var upload_file = function() {
      var uploader = document.getElementById('upload');
      uploader.click()
      upload_event();
    }

    // Control variables
    var controls = {
      'Path to file (csv or json)': "https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/0b9595c09b9f70a77ee05ca16d5a8b42a9130c9e/miserables.json",
      'Upload file (csv or json)': upload_file,
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
      'Link strength exponent': 0.1,
      'Link width exponent': 0.5,
      'Collision': false,
      'Node fill': '#16a085',
      'Node stroke': '#000000',
      'Link stroke': '#7c7c7c',
      'Label stroke': '#000000',
      'Show labels': false,
      'Zoom': 1.5,
      'Min. link weight %': 0,
      'Max. link weight %': 100
    };

    Reflect.ownKeys(new_controls).forEach(function(key){

        controls[key] = new_controls[key];
    });

    var gui = new dat.GUI({ autoPlace: false});
    var customContainer = document.getElementsByClassName('controls_container')[0];
    gui.width = customContainer.offsetWidth;
    gui.closed = false;
    customContainer.appendChild(gui.domElement);
    gui.remember(controls);

    var f1 = gui.addFolder('Input/output'); f1.open();
    f1.add(controls, 'Path to file (csv or json)', controls['Path to file (csv or json)']).onFinishChange(function(v) { handle_url(v) });
    f1.add(controls, 'Upload file (csv or json)')
    f1.add(controls, 'Download figure');

    var f2 = gui.addFolder('Physics'); f2.open();
    f2.add(controls, 'Charge strength', -100, 0).onChange(function(v) { inputtedCharge(v) });
    f2.add(controls, 'Center gravity', 0, 1).onChange(function(v) { inputtedGravity(v) });
    f2.add(controls, 'Link distance', 0.1, 50).onChange(function(v) { inputtedDistance(v) });
    f2.add(controls, 'Link strength exponent', 0., 1).onChange(function(v) { inputtedLinkStrengthExponent(v) });
    f2.add(controls, 'Collision', false).onChange(function(v) { inputtedCollision(v) });
    f2.add(controls, 'Apply heat (wiggle)', false).onChange(function(v) { inputtedReheat(v) });

    var f3 = gui.addFolder('Styling'); f3.open();
    f3.addColor(controls, 'Node fill', controls['Node fill']).onChange(function(v) { inputtedNodeFill(v) });
    f3.addColor(controls, 'Node stroke', controls['Node stroke']).onChange(function(v) { inputtedNodeStroke(v) });
    f3.addColor(controls, 'Link stroke', controls['Link stroke']).onChange(function(v) { inputtedLinkStroke(v) });
    f3.addColor(controls, 'Label stroke', controls['Label stroke']).onChange(function(v) { inputtedTextStroke(v) });
    f3.add(controls, 'Show labels', false).onChange(function(v) { inputtedShowLabels(v) });
    f3.add(controls, 'Link width', 0.01, 30).onChange(function(v) { inputtedLinkWidth(v) });
    f3.add(controls, 'Link alpha', 0, 1).onChange(function(v) { inputtedLinkAlpha(v) });
    f3.add(controls, 'Node size', 0, 50).onChange(function(v) { inputtedNodeSize(v) });
    f3.add(controls, 'Node stroke size', 0, 10).onChange(function(v) { inputtedNodeStrokeSize(v) });
    f3.add(controls, 'Node size exponent', 0., 3.).onChange(function(v) { inputtedNodeSizeExponent(v) });
    f3.add(controls, 'Link width exponent', 0., 3.).onChange(function(v) { inputtedLinkWidthExponent(v) });
    f3.add(controls, 'Zoom', 0.6, 5).onChange(function(v) { inputtedZoom(v) });

    var f4 = gui.addFolder('Percolation'); f4.close();
    f4.add(controls, 'Min. link weight %', 0, 99).onChange(function(v) { inputtedMinLinkWeight(v) }).listen();
    f4.add(controls, 'Max. link weight %', 1, 100).onChange(function(v) { inputtedMaxLinkWeight(v) }).listen();



    // Restart simulation. Only used when reloading data
    function restart(graph) {

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
        context.clearRect(0, 0, width, height);

        
        context.strokeStyle = controls['Link stroke'];
        context.globalAlpha = controls['Link alpha'];
        context.globalCompositeOperation = "destination-over"
        graph.links.forEach(drawLink);
        

        context.globalAlpha = 1.0
        context.strokeStyle = controls['Node stroke'];
        context.lineWidth = controls['Node stroke size'] * controls['Zoom'];
        context.globalCompositeOperation = "source-over"
        // context.lineWidth *= 2;
        graph.nodes.forEach(drawNode);
        graph.nodes.forEach(drawText);
        
      }

      simulation.alpha(1).restart();

    }

    handle_url(controls['Path to file (csv or json)']);
    upload_event();


    // Network functions
    // -----------------

    function dragsubject() {
      return simulation.find(zoom_scaler.invert(d3.event.x), zoom_scaler.invert(d3.event.y), 20);
    }

    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }


    function dragged() {
      d3.event.subject.fx = zoom_scaler.invert(event.clientX - canvas_offset_x);
      d3.event.subject.fy = zoom_scaler.invert(event.clientY - canvas_offset_y);
    }

    function dragended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    function drawLink(d) {
      thislinkwidth = (d.weight || 1)**(controls['Link width exponent']) * link_width_norm * controls['Link width'];
      context.beginPath();
      context.moveTo(zoom_scaler(d.source.x), zoom_scaler(d.source.y));
      context.lineTo(zoom_scaler(d.target.x), zoom_scaler(d.target.y));
      context.lineWidth = thislinkwidth * controls['Zoom'];
      context.stroke();
    }

    function drawNode(d) {
      // Node
      thisnodesize = (d.size || 1)**(controls['Node size exponent']) * node_size_norm * controls['Node size'];
      context.beginPath();
      context.moveTo(zoom_scaler(d.x) + thisnodesize * (controls['Zoom'] + (controls['Zoom'] - 1)), zoom_scaler(d.y));
      context.arc(zoom_scaler(d.x), zoom_scaler(d.y), thisnodesize * (controls['Zoom'] + (controls['Zoom'] - 1)), 0, 2 * Math.PI);
      context.fillStyle = computeNodeColor(d);
      context.fill();
      context.stroke();
    }

    function drawText(d) {
      if (controls['Show labels'] || d.id == hoveredNode || selectedNodes.includes(d.id)) {
        thisnodesize = (d.size || 1)**(controls['Node size exponent']) * node_size_norm * controls['Node size'];
        context.font = clip(thisnodesize * controls['Zoom'] * 2, 10, 20) + "px Helvetica"
        context.fillStyle = controls['Label stroke']
        context.fillText(d.id, zoom_scaler(d.x), zoom_scaler(d.y))
      }
    }


    // Utility functions
    // -----------------

    logscaler = d3.scaleLog()
    zoom_scaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])
    active_swatch = {0: controls['Node fill']}

    function computeNodeRadii(d) {
      thisnodesize = node_size_norm * controls['Node size'];
      if (d.size) {
        thisnodesize *= (d.size)**(controls['Node size exponent']);
      }
      return thisnodesize
    }

    function computeLinkStrength(d) {
      var base_strength = 1 / Math.min(node_degrees[d.source.id], node_degrees[d.target.id])
      return (1 / base_strength * d.weight / max_link_width)**(controls['Link strength exponent']) * base_strength
    }

    function computeNodeColor(d) {
      if (d.group) {
        return active_swatch[d.group]
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
      simulation.force("collide").radius(function(d) { return controls['Collision'] * computeNodeRadii(d) });
      simulation.alpha(1).restart();
    }

    function inputtedReheat(v) {+
      simulation.alpha(0.5);
      simulation.alphaTarget(v).restart();
    }


    // Styling
    function inputtedNodeFill(v) {

      window.dr = parseInt(v.slice(1, 3), 16) - parseInt(reference_color.slice(1, 3), 16)
      window.dg = parseInt(v.slice(3, 5), 16) - parseInt(reference_color.slice(3, 5), 16)
      window.db = parseInt(v.slice(5, 7), 16) - parseInt(reference_color.slice(5, 7), 16)

      for (var g of d3.keys(active_swatch)) {

        if (!isNaN(+g)) {

          var r_ = bounce_modulus(parseInt(reference_swatch[g].slice(1, 3), 16) + dr, 0, 255);
          var g_ = bounce_modulus(parseInt(reference_swatch[g].slice(3, 5), 16) + dg, 0, 255);
          var b_ = bounce_modulus(parseInt(reference_swatch[g].slice(5, 7), 16) + db, 0, 255);

          active_swatch[g] = '#' + toHex(r_) + toHex(g_) + toHex(b_);
        }
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

    function inputtedNodeSizeExponent(v) {
      if (controls['Node size exponent'] > 0) {
        node_size_norm = 1 / max_node_size**(controls['Node size exponent'])
      } else {
        node_size_norm = 1 / min_node_size**(controls['Node size exponent'])
      }
      if (controls['Collision']) {
        simulation.force("collide").radius(function(d) { return computeNodeRadii(d) })
        simulation.alpha(1).restart();
      } else {
        simulation.restart();
      }
    }

    function inputtedLinkWidthExponent(v) {
      if (controls['Link width exponent'] > 0) {
        link_width_norm = 1 / max_link_width**(controls['Link width exponent'])
      } else {
        link_width_norm = 1 / min_link_width**(controls['Link width exponent'])
      }
      simulation.restart();
    }

    function inputtedLinkStrengthExponent(v) {
      simulation.force("link").strength(function(d) { return computeLinkStrength(d); });
      simulation.alpha(1).restart();
    }

    function inputtedZoom(v) {
      zoom_scaler = d3.scaleLinear().domain([0, width]).range([width * (1 - controls['Zoom']), controls['Zoom'] * width])
      simulation.restart();
    }

    var vMinPrev = 0
    function inputtedMinLinkWeight(v) {
      if (shiftDown) {
        var dv = v - vMinPrev
        controls['Max. link weight %'] = d3.min([100, controls['Max. link weight %'] + dv])
      } else {
        controls['Max. link weight %'] = d3.max([controls['Max. link weight %'], v+1])
      }
      vMinPrev = v
      restart(shave(_.clone(master_graph)));
    }

    var vMaxPrev = 0
    function inputtedMaxLinkWeight(v) {
      if (shiftDown) {
        var dv = v - vMaxPrev
        controls['Min. link weight %'] = d3.max([0, controls['Min. link weight %'] + dv])
      } else {
        controls['Min. link weight %'] = d3.min([controls['Min. link weight %'], v-1])
      }
      vMaxPrev = v
      restart(shave(_.clone(master_graph)));
    }


    // Handle input data
    // -----------------
    function handle_url() {
      if (controls['Path to file (csv or json)'].endsWith(".json")) {
        d3.json(controls['Path to file (csv or json)'], function(error, graph) {
          if (error) {
            swal({text: "File not found", icon: "error"})
            return false
          }
          restart_if_valid_JSON(graph);
        })
      } else if (controls['Path to file (csv or json)'].endsWith(".csv")) {
        try {
          fetch(controls['Path to file (csv or json)']).then(r => r.text()).then(r => restart_if_valid_CSV(r));
        } catch(error) {
          throw error;
          swal({text: "File not found", icon: "error"})
        }
      }
    }


    function restart_if_valid_JSON(raw_graph) {
      // Check for 'nodes' and 'links' lists
      if (!raw_graph.nodes || raw_graph.nodes.length == 0) {
        swal({text: "Dataset does not have a key 'nodes'", icon: "error"})
        return false
      }
      if (!raw_graph.links) {
        swal({text: "Dataset does not have a key 'links'", icon: "warning"})
      }

      // Check that node and link objects are formatted right
      for (var d of raw_graph.nodes) {
        if (!d3.keys(d).includes("id")) {
          swal({text: "Found objects in 'nodes' without 'id' key.", icon: "error"});
          return false;
        }
      }
      for (var d of raw_graph.links) {
        if (!d3.keys(d).includes("source") || !d3.keys(d).includes("target")) {
          swal({text: "Found objects in 'links' without 'source' or 'target' key.", icon: "error"});
          return false;
        }
      }

      // Check that 'links' and 'nodes' data are congruent
      var nodes_nodes = raw_graph.nodes.map(d => {return d.id});
      var nodes_nodes_set = new Set(nodes_nodes)
      var links_nodes_set = new Set()
      raw_graph.links.forEach(l => {
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

      // Check that attributes are indicated consistently in both nodes and links
      var count_weight = raw_graph.links.filter(n => { return 'weight' in n }).length
      if (0 < count_weight & count_weight < raw_graph.links.length) {
        swal({text: "Found links with and links without 'weight' attribute", icon: "error"});
        return false; 
      } else if (count_weight == 0) {
        raw_graph.links.forEach(l => {l.weight = 1;})
      }
      var count_group = raw_graph.nodes.filter(n => { return 'group' in n }).length
      if (0 < count_group & count_group < raw_graph.nodes.length) {
        swal({text: "Found nodes with and nodes without 'group' attribute", icon: "error"});
        return false; 
      }
      var count_size = raw_graph.nodes.filter(n => { return 'size' in n }).length
      if (0 < count_size & count_size < raw_graph.nodes.length) {
        swal({text: "Found nodes with and nodes without 'size' attribute", icon: "error"});
        return false; 
      }
      else if (count_size == 0) {
        var node_strengths = new DefaultDict(Number)
        raw_graph.links.forEach(l => {
          node_strengths[l.source] += valIfValid(l.weight, 1);
          node_strengths[l.target] += valIfValid(l.weight, 1);
        });
        raw_graph.nodes.forEach(n => {n.size = node_strengths[n.id];})
      }

      // Check for foreign node and link attributes
      var foreign_nodes_attributes = new Set()
      raw_graph.nodes.forEach(d => {
        d3.keys(d).forEach(k => {
          if (!['id', 'size', 'group'].includes(k)) foreign_nodes_attributes.add(k)
        })
      })
      var foreign_links_attributes = new Set()
      raw_graph.links.forEach(d => {
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

      master_graph = raw_graph

      // Compute and store global variables
      compute_graph_globals(master_graph);

      // Run the restart if all of this was OK
      restart(shave(_.clone(master_graph)));
    }


    function restart_if_valid_CSV(raw_input) {
      // Assume header is "source,target(,weight)"
      var links = d3.csvParse(raw_input).map(l => {
        return {'source': l.source, 'target': l.target, 'weight': +valIfValid(l.weight, 1)}
      })

      var node_strengths = new DefaultDict(Number)
      links.forEach(l => {
        node_strengths[l.source] += valIfValid(l.weight, 1);
        node_strengths[l.target] += valIfValid(l.weight, 1);
      });

      // Warn against zero links
      var zero_links_count = 0
      links = links.filter(l => {
        if (l.weight == 0) {
          zero_links_count += 1;
        } else {
          return l;
        }
      })

      if (zero_links_count > 0) {
        swal({text: "Removed " + zero_links_count + " links with weight 0", icon: "warning"})
      }

      master_graph = {'nodes': [], 'links': links}
      d3.keys(node_strengths).forEach(k => {master_graph.nodes.push({'id': k, 'size': node_strengths[k]})})

      // Compute and store global variables
      compute_graph_globals(master_graph);

      // Input graph that respects user input percolation boundaries
      restart(shave(_.clone(master_graph)));
    }

    // Various utilities
    // -----------------

    function compute_graph_globals(graph) {
      // Compute node size norms
      max_node_size = d3.max(graph.nodes.map(n => { if (n.size) { return n.size } else return 0; }));
      min_node_size = d3.min(graph.nodes.map(n => { if (n.size) { return n.size } else return 1; }));

      if (controls['Node size exponent'] > 0) {
        node_size_norm = 1 / max_node_size**(controls['Node size exponent'])
      } else {
        node_size_norm = 1 / min_node_size**(controls['Node size exponent'])
      }

      // Compute link width norms
      max_link_width = d3.max(graph.links.map(l => { if (l.weight) { return l.weight } else return 0; }));
      min_link_width = d3.min(graph.links.map(l => { if (l.weight) { return l.weight } else return 1; }));

      if (controls['Link width exponent'] > 0) {
        link_width_norm = 1 / max_link_width**(controls['Link width exponent'])
      } else {
        link_width_norm = 1 / min_link_width**(controls['Link width exponent'])
      }

      // Sort out node colors
      var node_groups = new Set(graph.nodes.filter(n => 'group' in n).map(n => {return n.group}))
      for (var g of node_groups) {
        if (typeof(g) == "string") {
          active_swatch[g] = g
        } else {
          active_swatch[g] = '#'+Math.floor(Math.random()*16777215).toString(16);
        }
      }
      window.reference_swatch = _.clone(active_swatch)
      reference_color = controls['Node fill']

      node_degrees = new DefaultDict(Number)
      graph.links.forEach(l => {
        node_degrees[l.source] += 1;
        node_degrees[l.target] += 1;
      });

        // pass the new values to the simulation
        Reflect.ownKeys(new_controls).forEach(function(key){

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
    }

    function shave(input_graph) {
      // Compute what number a percentage corresponds to
      var interval_range = function(percent) {
        return percent / 100 * (max_link_width - min_link_width) + min_link_width
      }
      // Shave links
      var graph_displayed = input_graph
      graph_displayed['links'] = graph_displayed.links.filter(l => {
        return (interval_range(controls['Min. link weight %']) <= l.weight) && (l.weight <= interval_range(controls['Max. link weight %']))
      })
      return graph_displayed
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

    function bounce_modulus(v, lower, upper) {
      if (lower <= v & v <= upper) {
        return v;
      }
      if (v < lower) {
        return bounce_modulus(lower + (lower - v), lower, upper);
      }
      if (v > upper) {
        return bounce_modulus(upper - (v - upper), lower, upper);
      }
    }

    function toHex(v) {
      var hv = v.toString(16)
      if (hv.length == 1) hv = "0" + hv;
      return hv;
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
    window.onkeydown = function(){
      if (window.event.keyCode == 16) {
        shiftDown = true;
      }
    }
    window.onkeyup = function(){
      shiftDown = false;
    }

    var hoveredNode;
    var selectedNodes = [];
    var xy;
    d3.select(canvas).on("mousemove", function() {
      if (!controls['Show labels']) {
        xy = d3.mouse(this) 
        hoveredNode = simulation.find(zoom_scaler.invert(xy[0]), zoom_scaler.invert(xy[1]), 20)
        if (typeof(hoveredNode) != 'undefined') {
          hoveredNode = hoveredNode.id;
        }
        simulation.restart();
      }
    })

    window.addEventListener("mousedown", function() { 
      if (typeof(hoveredNode) != 'undefined') {
        if (selectedNodes.includes(hoveredNode)) {
          selectedNodes.splice(selectedNodes.indexOf(hoveredNode), 1)
        } else {
          selectedNodes.push(hoveredNode)
        }
        simulation.restart();
      }
    }, true)
}
