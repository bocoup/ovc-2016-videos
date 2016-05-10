import nltk
import os
import re
from string import punctuation
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# taken from https://github.com/dariusk/corpora/blob/master/data/words/stopwords/en.json
corpora_stopwords = ["'ll", "'ve", "a", "a's", "able", "about", "above", "abroad", "abst", "accordance", "according", "accordingly", "across", "act", "actually", "added", "adj", "adopted", "affected", "affecting", "affects", "after", "afterwards", "again", "against", "ago", "ah", "ahead", "ain't", "all", "allow", "allows", "almost", "alone", "along", "alongside", "already", "also", "although", "always", "am", "amid", "amidst", "among", "amongst", "amoungst", "amount", "an", "and", "announce", "another", "any", "anybody", "anyhow", "anymore", "anyone", "anything", "anyway", "anyways", "anywhere", "apart", "apparently", "appear", "appreciate", "appropriate", "approximately", "are", "aren", "aren't", "arent", "arise", "around", "as", "aside", "ask", "asking", "associated", "at", "auth", "available", "away", "awfully", "b", "back", "backward", "backwards", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "begin", "beginning", "beginnings", "begins", "behind", "being", "believe", "below", "beside", "besides", "best", "better", "between", "beyond", "bill", "biol", "both", "bottom", "brief", "briefly", "but", "by", "c", "c'mon", "c's", "ca", "call", "came", "can", "can't", "cannot", "cant", "caption", "cause", "causes", "certain", "certainly", "changes", "clearly", "co", "co.", "com", "come", "comes", "computer", "con", "concerning", "consequently", "consider", "considering", "contain", "containing", "contains", "corresponding", "could", "couldn't", "couldnt", "course", "cry", "currently", "d", "dare", "daren't", "date", "de", "definitely", "describe", "described", "despite", "detail", "did", "didn't", "different", "directly", "do", "does", "doesn't", "doing", "don't", "done", "down", "downwards", "due", "during", "e", "each", "ed", "edu", "effect", "eg", "eight", "eighty", "either", "eleven", "else", "elsewhere", "empty", "end", "ending", "enough", "entirely", "especially", "et", "et-al", "etc", "even", "ever", "evermore", "every", "everybody", "everyone", "everything", "everywhere", "ex", "exactly", "example", "except", "f", "fairly", "far", "farther", "few", "fewer", "ff", "fifteen", "fifth", "fify", "fill", "find", "fire", "first", "five", "fix", "followed", "following", "follows", "for", "forever", "former", "formerly", "forth", "forty", "forward", "found", "four", "from", "front", "full", "further", "furthermore", "g", "gave", "get", "gets", "getting", "give", "given", "gives", "giving", "go", "goes", "going", "gone", "got", "gotten", "greetings", "h", "had", "hadn't", "half", "happens", "hardly", "has", "hasn't", "hasnt", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "hed", "hello", "help", "hence", "her", "here", "here's", "hereafter", "hereby", "herein", "heres", "hereupon", "hers", "herself", "herse”", "hes", "hi", "hid", "him", "himself", "himse”", "his", "hither", "home", "hopefully", "how", "how's", "howbeit", "however", "hundred", "i", "i'd", "i'll", "i'm", "i've", "id", "ie", "if", "ignored", "im", "immediate", "immediately", "importance", "important", "in", "inasmuch", "inc", "inc.", "indeed", "index", "indicate", "indicated", "indicates", "information", "inner", "inside", "insofar", "instead", "interest", "into", "invention", "inward", "is", "isn't", "it", "it'd", "it'll", "it's", "itd", "its", "itself", "itse”", "j", "just", "k", "keep", "keeps", "kept", "keys", "kg", "km", "know", "known", "knows", "l", "largely", "last", "lately", "later", "latter", "latterly", "least", "less", "lest", "let", "let's", "lets", "like", "liked", "likely", "likewise", "line", "little", "look", "looking", "looks", "low", "lower", "ltd", "m", "made", "mainly", "make", "makes", "many", "may", "maybe", "mayn't", "me", "mean", "means", "meantime", "meanwhile", "merely", "mg", "might", "mightn't", "mill", "million", "mine", "minus", "miss", "ml", "more", "moreover", "most", "mostly", "move", "mr", "mrs", "much", "mug", "must", "mustn't", "my", "myself", "myse”", "n", "na", "name", "namely", "nay", "nd", "near", "nearly", "necessarily", "necessary", "need", "needn't", "needs", "neither", "never", "neverf", "neverless", "nevertheless", "new", "next", "nine", "ninety", "no", "no-one", "nobody", "non", "none", "nonetheless", "noone", "nor", "normally", "nos", "not", "noted", "nothing", "notwithstanding", "novel", "now", "nowhere", "o", "obtain", "obtained", "obviously", "of", "off", "often", "oh", "ok", "okay", "old", "omitted", "on", "once", "one", "one's", "ones", "only", "onto", "opposite", "or", "ord", "other", "others", "otherwise", "ought", "oughtn't", "our", "ours", "ours ", "ourselves", "out", "outside", "over", "overall", "owing", "own", "p", "page", "pages", "part", "particular", "particularly", "past", "per", "perhaps", "placed", "please", "plus", "poorly", "possible", "possibly", "potentially", "pp", "predominantly", "present", "presumably", "previously", "primarily", "probably", "promptly", "proud", "provided", "provides", "put", "q", "que", "quickly", "quite", "qv", "r", "ran", "rather", "rd", "re", "readily", "really", "reasonably", "recent", "recently", "ref", "refs", "regarding", "regardless", "regards", "related", "relatively", "research", "respectively", "resulted", "resulting", "results", "right", "round", "run", "s", "said", "same", "saw", "say", "saying", "says", "sec", "second", "secondly", "section", "see", "seeing", "seem", "seemed", "seeming", "seems", "seen", "self", "selves", "sensible", "sent", "serious", "seriously", "seven", "several", "shall", "shan't", "she", "she'd", "she'll", "she's", "shed", "shes", "should", "shouldn't", "show", "showed", "shown", "showns", "shows", "side", "significant", "significantly", "similar", "similarly", "since", "sincere", "six", "sixty", "slightly", "so", "some", "somebody", "someday", "somehow", "someone", "somethan", "something", "sometime", "sometimes", "somewhat", "somewhere", "soon", "sorry", "specifically", "specified", "specify", "specifying", "state", "states", "still", "stop", "strongly", "sub", "substantially", "successfully", "such", "sufficiently", "suggest", "sup", "sure", "system", "t", "t's", "take", "taken", "taking", "tell", "ten", "tends", "th", "than", "thank", "thanks", "thanx", "that", "that'll", "that's", "that've", "thats", "the", "their", "theirs", "them", "themselves", "then", "thence", "there", "there'd", "there'll", "there're", "there's", "there've", "thereafter", "thereby", "thered", "therefore", "therein", "thereof", "therere", "theres", "thereto", "thereupon", "these", "they", "they'd", "they'll", "they're", "they've", "theyd", "theyre", "thick", "thin", "thing", "things", "think", "third", "thirty", "this", "thorough", "thoroughly", "those", "thou", "though", "thoughh", "thousand", "three", "throug", "through", "throughout", "thru", "thus", "til", "till", "tip", "to", "together", "too", "took", "top", "toward", "towards", "tried", "tries", "truly", "try", "trying", "ts", "twelve", "twenty", "twice", "two", "u", "un", "under", "underneath", "undoing", "unfortunately", "unless", "unlike", "unlikely", "until", "unto", "up", "upon", "ups", "upwards", "us", "use", "used", "useful", "usefully", "usefulness", "uses", "using", "usually", "uucp", "v", "value", "various", "versus", "very", "via", "viz", "vol", "vols", "vs", "w", "want", "wants", "was", "wasn't", "way", "we", "we'd", "we'll", "we're", "we've", "wed", "welcome", "well", "went", "were", "weren't", "what", "what'll", "what's", "what've", "whatever", "whats", "when", "when's", "whence", "whenever", "where", "where's", "whereafter", "whereas", "whereby", "wherein", "wheres", "whereupon", "wherever", "whether", "which", "whichever", "while", "whilst", "whim", "whither", "who", "who'd", "who'll", "who's", "whod", "whoever", "whole", "whom", "whomever", "whos", "whose", "why", "why's", "widely", "will", "willing", "wish", "with", "within", "without", "won't", "wonder", "words", "world", "would", "wouldn't", "www", "x", "y", "yes", "yet", "you", "you'd", "you'll", "you're", "you've", "youd", "your", "youre", "yours", "yourself", "yourselves", "z", "zero", "zero﻿I", "﻿a", "﻿able"]

# Many of these functions are taken from https://github.com/bocoup-education/text-vis-ovc
# in particular the 14-analyze-document notebook

files = [
    "../data/transcripts-no-timestamp/ovc2016_25_01_wattenberg_viegas.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_02_mcdonald.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_03_kosaka.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_04_case.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_05_mcnamara.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_06_bremer.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_07_vivo.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_08_armstrong.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_09_wu.txt",
    "../data/transcripts-no-timestamp/ovc2016_25_10_chu.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_01_chalabi.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_02_yanofsky.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_03_elliott.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_04_binx.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_05_satyanarayan.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_06_pearce.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_07_hullman.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_08_albrecht.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_09_waigl.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_10_collins.txt",
    "../data/transcripts-no-timestamp/ovc2016_26_11_becker.txt"
]

def get_files():
    return files

def get_filename_with_timestamps(filename):
    return filename.replace('transcripts-no-timestamp', 'transcripts-with-timestamp')


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
    tokens = remove_tokens(tokens, corpora_stopwords)
    tokens = remove_word_fragments(tokens)

    # optionally stem tokens
    if stem:
        stemmer = PorterStemmer()
        tokens = [stemmer.stem(token) for token in tokens]

    return tokens
