# ovc-2016-videos
Code for visualizing videos from [OpenVis Conf 2016](http://openvisconf.com).

## Analysis

The text analysis was done in Python (tested with Python 3.5) and is stored in the `analysis` directory. To run the scripts, simply run `python <script.py>`  (e.g., `python analyze_top_terms.py`)
  
| Script | Description |
| ------ | ----------- |
| **analyze_bigrams.py** | Finds the top 50 bigrams in the transcripts for each talk |
| **analyze_tifdf.py** | Finds the top 50 terms in the transcripts for each talk by TF-IDF score |
| **analyze_top_terms.py** | Finds the top 50 terms and top 50 bigrams from each talk, maps them to a similar score and matches them with timestamps. This is the main script used by the visualization. |
| **analyze_trigrams.py** | Finds the top 50 trigrams in the transcripts for each talk |
|  **match_timestamps.py** |  Matches terms and bigrams to timestamps in the transcripts |

## Visualization

The visualization code is in the `app` directory. The vis was built using React and D3. 

### Set up
1. In the `app` directory, install dependencies with `npm install`
1. To get the development server with hot-reloading started, run `grunt`
1. Open a browser to http://localhost:8080

### Building
1. To build files for production, run `grunt deploy`


## Data

The transcripts are available both with timestamps and without in the `data` directory.

## Contact
For any questions, please email openvisconf@bocoup.com.
