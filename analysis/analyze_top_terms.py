import nltk
from nltk.collocations import BigramCollocationFinder
from utils import tokenize_transcripts, get_files
from collections import Counter
import math

# Uses tfidf and bigrams and assigns scores using the tfidf
# score for individual tokens and the sum of the tfidf score
# for bigram tokens


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
transcript_tokens = tokenize_transcripts(stem=True)

# get files to iterate over
files = get_files()

tfidf_results = []

# compute tf-idf and store
for i, file in enumerate(files):
    token_tf_idfs = tf_idf(transcript_tokens[i], transcript_tokens)
    sorted_token_tf_idfs = sort_counts(token_tf_idfs)
    tfidf_results.append(sorted_token_tf_idfs)

    # print(file)
    # for [token, value] in sorted_token_tf_idfs[0:50]:
    #     print('{},{}'.format(token, value))
    # print('---------\n')


# built in bigram metrics are in here
bigram_measures = nltk.collocations.BigramAssocMeasures()

bigram_results = []

# compute top bigrams and output results to console
for i, file in enumerate(files):
    finder = BigramCollocationFinder.from_words(transcript_tokens[i])
    bigrams = finder.score_ngrams(bigram_measures.likelihood_ratio)
    bigram_results.append(bigrams)

    # print(file)
    # for [tokens, value] in bigrams[0:50]:
    #     print('{},{}'.format(" ".join(tokens), value))
    # print('---------\n')

# limit to top N
limit = 50

def get_tfidf_score(term, tfidf):
    return next((tfidf_tuple[1] for tfidf_tuple in tfidf if tfidf_tuple[0] == term), 0)

combined_results = []

# take top N tfidf terms and top N bigrams, give bigrams score as average of tfidf terms
for i, file in enumerate(files):
    tfidf = tfidf_results[i]
    bigrams = bigram_results[i][:limit]

    combined = tfidf[:limit]

    for bigram in bigrams:
        terms = bigram[0]

        # find tfidf score for each term
        score = (get_tfidf_score(terms[0], tfidf) + get_tfidf_score(terms[1], tfidf)) / 2
        combined.append(("{} {}".format(terms[0], terms[1]), score))


    # sort the combined list
    combined = sorted(combined, key=lambda termScore: termScore[1], reverse=True)

    print(file)
    for [term, value] in combined:
        print('"{}",{}'.format(term, value))
    print('---------\n')
