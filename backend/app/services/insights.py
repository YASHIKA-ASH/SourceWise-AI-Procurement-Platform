def generate_insights(supplier):

    insights = []

    if supplier["price"] < 400:
        insights.append("Lowest procurement cost.")

    if supplier["lead_time"] <= 10:
        insights.append("Fast delivery reduces production delays.")

    if supplier["score"] > 25:
        insights.append("Highest overall procurement score.")

    if supplier["risk"] < 10:
        insights.append("Low supplier risk.")

    return insights