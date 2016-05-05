import nltk
from nltk.collocations import TrigramCollocationFinder
from utils import tokenize_transcripts, get_files

# a list of tokens for each of the talks
transcript_tokens = tokenize_transcripts()

# built in trigram metrics are in here
trigram_measures = nltk.collocations.TrigramAssocMeasures()

# compute top trigrams and output results to console
for i, file in enumerate(get_files()):
    finder = TrigramCollocationFinder.from_words(transcript_tokens[i])
    trigrams = finder.score_ngrams(trigram_measures.likelihood_ratio)

    print(file)
    for [tokens, value] in trigrams[0:50]:
        print('{},{}'.format(" ".join(tokens), value))
    print('---------\n')
