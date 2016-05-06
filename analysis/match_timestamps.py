import nltk
from utils import words_from_file, prepare_tokens
import datetime
import time
x = time.strptime('00:01:00,000'.split(',')[0],'%H:%M:%S')
60.0
filename = "../transcripts-with-timestamp/ovc2016_25_01_wattenberg_viegas.txt"

def tokenize_line(line):
    words = nltk.word_tokenize(line)
    return prepare_tokens(words, stem=True)


def time_to_delta_seconds(time_str, start_time):
    time_obj = time.strptime(time_str, '%H:%M:%S')
    seconds = datetime.timedelta(hours=time_obj.tm_hour, minutes=time_obj.tm_min, seconds=time_obj.tm_sec).total_seconds()
    delta = int(seconds - start_time)
    return delta



with open(filename) as handle:
    lines = handle.readlines()

lines = [line.rstrip('\n').split('\t') for line in lines]

# get the first timestamp in the document
start_time = time_to_delta_seconds(lines[0][0], 0)

# convert timestamp to delta seconds, tokenize the line as individual words
lines = [(time_to_delta_seconds(line[0], start_time), tokenize_line(line[1])) for line in lines]


# map words to timestamps
tokens_to_timestamps = {}
for line in lines:
    timestamp = line[0]
    tokens = line[1]
    for token in tokens:
        if token in tokens_to_timestamps:
            if timestamp not in tokens_to_timestamps[token]:
                tokens_to_timestamps[token].append(timestamp)
        else:
            tokens_to_timestamps[token] = [timestamp]


print(tokens_to_timestamps)