import nltk
import os
import re
from string import punctuation
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Many of these functions are taken from https://github.com/bocoup-education/text-vis-ovc
# in particular the 14-analyze-document notebook

files = [
    "../transcripts-no-timestamp/ovc2016_25_01_wattenberg_viegas.txt",
    "../transcripts-no-timestamp/ovc2016_25_02_mcdonald.txt",
    "../transcripts-no-timestamp/ovc2016_25_03_kosaka.txt",
    "../transcripts-no-timestamp/ovc2016_25_04_case.txt",
    "../transcripts-no-timestamp/ovc2016_25_05_mcnamara.txt",
    "../transcripts-no-timestamp/ovc2016_25_06_bremer.txt",
    "../transcripts-no-timestamp/ovc2016_25_07_vivo.txt",
    "../transcripts-no-timestamp/ovc2016_25_08_armstrong.txt",
    "../transcripts-no-timestamp/ovc2016_25_09_wu.txt",
    "../transcripts-no-timestamp/ovc2016_25_10_chu.txt",
    "../transcripts-no-timestamp/ovc2016_26_01_chalabi.txt",
    "../transcripts-no-timestamp/ovc2016_26_02_yanofsky.txt",
    "../transcripts-no-timestamp/ovc2016_26_03_elliott.txt",
    "../transcripts-no-timestamp/ovc2016_26_04_binx.txt",
    "../transcripts-no-timestamp/ovc2016_26_05_satyanarayan.txt",
    "../transcripts-no-timestamp/ovc2016_26_06_pearce.txt",
    "../transcripts-no-timestamp/ovc2016_26_07_hullman.txt",
    "../transcripts-no-timestamp/ovc2016_26_08_albrecht.txt",
    "../transcripts-no-timestamp/ovc2016_26_09_waigl.txt",
    "../transcripts-no-timestamp/ovc2016_26_10_collins.txt",
    "../transcripts-no-timestamp/ovc2016_26_11_becker.txt"
]

def get_files():
    return files

def tokenize_transcripts(stem=False):
    dir = os.path.dirname(__file__)

    # a list of tokens for each of the talks
    transcript_tokens = []

    # tokenize all the transcripts
    for filename in files:
        words = prepare_tokens(words_from_file(os.path.join(dir, filename)), stem)

        # add list of tokens for talk to collection
        transcript_tokens.append(words)

    return transcript_tokens


# input: list of tokens
# input: string or list of tokens to remove
# output: list of tokens with remove_tokens removed
def remove_tokens(tokens, remove_tokens):
    return [token for token in tokens if token not in remove_tokens]

# read text from a file and tokenize via nltk word_tokenize
def words_from_file(filename):
    with open(filename) as handle:
        text = handle.read()

    # remove newlines
    text = re.sub(r'\n', ' ', text)

    return nltk.word_tokenize(text)

# input: list of tokens
# output: list of tokens with every token having only lowercase letters.
def lowercase(tokens):
    return [token.lower() for token in tokens]

# remove word fragments like 's  and 't
def remove_word_fragments(tokens):
    return [token for token in tokens if "'" not in token]

# prepare tokens by removing punctuation, making lowercase and removing stop words
def prepare_tokens(tokens, stem=False):
    stops = stopwords.words('english')
    tokens = remove_tokens(tokens, punctuation + "--")
    tokens = lowercase(tokens)
    tokens = remove_tokens(tokens, stops)
    tokens = remove_word_fragments(tokens)

    # optionally stem tokens
    if stem:
        stemmer = PorterStemmer()
        tokens = [stemmer.stem(token) for token in tokens]

    return tokens
