import nltk
from nltk.collocations import BigramCollocationFinder
from utils import tokenize_transcripts, get_files

# a list of tokens for each of the talks
transcript_tokens = tokenize_transcripts(stem=True)

# built in bigram metrics are in here
bigram_measures = nltk.collocations.BigramAssocMeasures()

# compute top bigrams and output results to console
for i, file in enumerate(get_files()):
    finder = BigramCollocationFinder.from_words(transcript_tokens[i])
    bigrams = finder.score_ngrams(bigram_measures.likelihood_ratio)

    print(file)
    for [tokens, value] in bigrams[0:50]:
        print('{},{}'.format(" ".join(tokens), value))
    print('---------\n')
