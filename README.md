# What is this?

Small web app for styling networks with buttons and sliders, powered [d3-force](https://github.com/d3/d3-force).

<p align="center"><img src="http://ulfaslak.com/files/network_webapp_teaser.png" width=600></p>


## Scenario
You need to visualize a network and show it to people. The easy solution is to use `networkx`, which at best looks like a nightmare. Instead you go through the trouble of throwing your data into your [favorite d3 boilerplate example](https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048), play with the simulation parameters and screenshot the network when it looks nice. The difference is remarkable: 

![networkx_vs_d3](http://ulfaslak.com/files/ugly_not_ugly.png)

Your audience will applaud your design skills and ask you how you make your figures over drinks that they payed for.

## Why should I use this?
This project is aimed at solving the problem of **quickly making beautiful network visualizations**. The philosophy is that d3 completely solved this problem with its force layout API and that this needs to be put to use to the benefit of a broader audience in a simple web application. The goal is to create a **minimal interface** where users can **upload** a network, **style** it nicely and **save** it to their desktop.

# Current state

In it's current state the app allows users to:
1. Specify the address of a network
2. Alter the force layout parameters and other styling parameters
3. Download the network

Networks must be formatted as JSON ([example](https://gist.githubusercontent.com/ulfaslak/6be66de1ac3288d5c1d9452570cbba5a/raw/4cab5036464800e51ce59fc088688e9821795efb/miserables.json)). If hosted online, data must be accessible via a CORS enabled link (see [this](https://beta.observablehq.com/@mbostock/introduction-to-data)). Nodes and links with attributes 'size' and 'weight', respectively, will be scaled accordingly – nodes size increases with 'size' and link distance shortens with 'weigh'. Here's an example piece of Python code that takes a `networkx.Graph` object `G` and saves it in a valid file format:

```Python
from collections import defaultdict

data = defaultdict(list)
for n in G.nodes():
    data['nodes'].append({'id': str(n), 'size': G.degree(n)})
for e in G.edges():
    data['links'].append({'source': str(e[0]), 'target': str(e[1])})
    
with open('network.json', 'w') as fp:
    json.dump(data, fp)
```

To run the app, clone the repository, navigate to the project and run `python -m "SimpleHTTPServer" 8000`, then open a browser and go to `localhost:8000`. If you just want to check it out real quick, [it is also live here](http://ulfaslak.com/network_styling_with_d3/index.html).
