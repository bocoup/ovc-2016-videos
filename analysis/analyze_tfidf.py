from utils import tokenize_transcripts, get_files
from collections import Counter
import math

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
transcript_tokens = tokenize_transcripts()

# compute tf-idf and output results to console
for i, file in enumerate(get_files()):
    token_tf_idfs = tf_idf(transcript_tokens[i], transcript_tokens)
    sorted_token_tf_idfs = sort_counts(token_tf_idfs)

    print(file)
    for [token, value] in sorted_token_tf_idfs[0:20]:
        print('{},{}'.format(token, value))
    print('---------\n')
