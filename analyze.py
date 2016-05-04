import nltk
import re
import math
from string import punctuation
from nltk.corpus import stopwords
from collections import Counter

files = [
  "transcripts_no_timestamp/ovc2016_25_01_wattenberg_viegas.txt",
  "transcripts_no_timestamp/ovc2016_25_02_mcdonald.txt",
  "transcripts_no_timestamp/ovc2016_25_03_kosaka.txt",
  "transcripts_no_timestamp/ovc2016_25_04_case.txt",
  "transcripts_no_timestamp/ovc2016_25_05_mcnamara.txt",
  "transcripts_no_timestamp/ovc2016_25_06_bremer.txt",
  "transcripts_no_timestamp/ovc2016_25_07_vivo.txt",
  "transcripts_no_timestamp/ovc2016_25_08_armstrong.txt",
  "transcripts_no_timestamp/ovc2016_25_09_wu.txt",
  "transcripts_no_timestamp/ovc2016_25_10_chu.txt",
  "transcripts_no_timestamp/ovc2016_26_01_chalabi.txt",
  "transcripts_no_timestamp/ovc2016_26_02_yanofsky.txt",
  "transcripts_no_timestamp/ovc2016_26_03_elliott.txt",
  "transcripts_no_timestamp/ovc2016_26_04_binx.txt",
  "transcripts_no_timestamp/ovc2016_26_05_satyanarayan.txt",
  "transcripts_no_timestamp/ovc2016_26_06_pearce.txt",
  "transcripts_no_timestamp/ovc2016_26_07_hullman.txt",
  "transcripts_no_timestamp/ovc2016_26_08_albrecht.txt",
  "transcripts_no_timestamp/ovc2016_26_09_waigl.txt",
  "transcripts_no_timestamp/ovc2016_26_10_collins.txt",
  "transcripts_no_timestamp/ovc2016_26_11_becker.txt"
]

# Many of these functions are taken from https://github.com/bocoup-education/text-vis-ovc
# in particular the 14-analyze-document notebook

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
def prepare_tokens(tokens):
  stops = stopwords.words('english')
  tokens = remove_tokens(tokens, punctuation + "--")
  tokens = lowercase(tokens)
  tokens = remove_tokens(tokens, stops)
  tokens = remove_word_fragments(tokens)
  return tokens

# input: list of tokens
# returns: dict of counts
def get_counts(tokens):
    return Counter(tokens)

# input: dictionary of tokens:counts
# returns: sorted list of (token, count)
def sort_counts(counts):
    return sorted(counts.items(), key=lambda count: count[1], reverse=True)


# input token: the token we are looking at
# input counts: token count dictionary for one document
def term_frequency(token, counts):
    '''Calculate term frequency for a particular token in a particular document'''
    return counts[token] / float(len(counts.keys()))

# input token: a token to search the corpora for
# input corpus_tokens: list of lists of tokens.
#  One list for each document in the corpora.
# output: number of documents in corpora that contain the token.
def document_frequency(token, corpus_tokens):
    '''Returns number of times a token appears in a set of documents'''
    doc_count = 0
    for tokens in corpus_tokens:

        if token in tokens:
            doc_count += 1

    return doc_count

# input: token: token we are analyzing
# input: corpus_tokens: list of lists of tokens.
#  One list for each document in the corpora.
def inverse_doc_frequency(token, corpus_tokens):
    return math.log(1 +  len(corpus_tokens) / (document_frequency(token, corpus_tokens) + 1))


# input document_tokens: a list of tokens that represent a document
# input corpus_tokens: list of lists of tokens.
#  One list for each document in the corpora.
# output: list of (token, tf-idf) values for each unique token in document_tokens
def tf_idf(document_tokens, corpus_tokens):


    # Get our token frequencies for all the unique tokens in our document
    token_counts = get_counts(document_tokens)

    # iterate through these tokens and calculate the tf-idf
    tfidfs = {}
    for token in token_counts.keys():

        tf = term_frequency(token, token_counts)
        idf = inverse_doc_frequency(token, corpus_tokens)

        tfidfs[token] = tf * idf


    return tfidfs


# a list of tokens for each of the talks
transcript_tokens = []

# tokenize all the transcripts
for filename in files:
  words = prepare_tokens(words_from_file(filename))

  # add list of tokens for talk to collection
  transcript_tokens.append(words)


# compute tf-idf and output results to console
for i, file in enumerate(files):
  token_tf_idfs = tf_idf(transcript_tokens[i], transcript_tokens)
  sorted_token_tf_idfs = sort_counts(token_tf_idfs)

  print(file)
  for [token, value] in sorted_token_tf_idfs[0:20]:
    print('{},{}'.format(token, value))
  print('---------\n')
