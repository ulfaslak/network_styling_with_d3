Small web app for styling networks with buttons and sliders, powered by [d3-force](https://github.com/d3/d3-force).

<p align="center"><img src="http://ulfaslak.com/files/network_webapp_teaser.png" width=600></p>

### Scenario
You need to visualize a network and show it to people. The easy solution is to use `networkx`, which at best looks like a nightmare. Instead you go through the trouble of throwing your data into your [favorite d3 boilerplate example](https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048), play with the simulation parameters and screenshot the network when it looks nice. The difference is remarkable: 

![networkx_vs_d3](http://ulfaslak.com/files/ugly_not_ugly.png)

Your audience will applaud your design skills and ask you how you make your figures over drinks that they payed for.

### Why should I use this?
This project is aimed at solving the problem of **quickly making beautiful network plots**. The philosophy is that d3 completely solved this problem with its force layout API and that this needs to be put to use to the benefit of a broader audience in a simple web application. The goal is to create a **minimal interface** where users can **upload** a network, **style** it nicely and **save** it to their desktop.
