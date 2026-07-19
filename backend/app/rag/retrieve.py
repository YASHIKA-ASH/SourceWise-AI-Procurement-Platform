from app.rag.vectordb import search
from app.rag.bm25 import search_bm25


def hybrid_search(question):

    semantic = search(question)

    keyword = search_bm25(question)

    return {

        "semantic": semantic,

        "keyword": keyword

    }