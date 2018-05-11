## About

Small web app for styling networks with buttons and sliders, powered [d3-force](https://github.com/d3/d3-force).

## Scenario
You need to visualize a network and show it to people. The easy solution is to use `networkx`, which at best looks like a nightmare, and since you care too much you go through the trouble of throwing your data into your [favorite d3 boilerplate example](https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048), play with the simulation parameters and screenshot the network when it looks nice. The difference is remarkable: 

![img](http://ulfaslak.com/files/ugly_not_ugly.png)

Your audience will applaud your design skills and ask you how you make your figures.

## Solution
This project is aimed at solving the problem of **quickly making beautiful network visualizations**. The philosophy is that d3 completely solved this problem with its force layout API and that this needs to be put to use to the benefit of a broader audience in a simple web application.
