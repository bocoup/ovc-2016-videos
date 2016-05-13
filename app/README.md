# ovc-2016-video Visualization Code

Code to generate visualizations of the videos from OpenVis Conf 2016.

## Set up
1. In the `app` directory, install dependencies with `npm install`
1. To get the development server with hot-reloading started, run `grunt`
1. Open a browser to http://localhost:8080

## Building
1. To build files for production, run `grunt deploy`

## Data used in the visualization

The data used in the visualization is found in `src/data`, compiled from the output of the text analysis from the [analysis](https://github.com/bocoup/ovc-2016-videos/tree/master/analysis) directory one level up, and the use of [filmstrip](https://github.com/tafsiri/filmstrip) to process the videos.
