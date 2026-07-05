from fastapi import APIRouter

router = APIRouter(prefix="/executive", tags=["Executive"])

@router.get("/")
def executive():

    return {

        "summary":
        "Recommended supplier provides the highest quality, lowest operational risk, optimized procurement cost and reliable delivery performance."

    }