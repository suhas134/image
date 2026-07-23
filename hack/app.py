from flask import Flask, render_template, request, jsonify
import base64
import random

app = Flask(__name__)

carbon_data = {
    "car": {"type": "transport", "co2_per_km": 0.21},
    "bike": {"type": "transport", "co2_per_km": 0.1},
    "bus": {"type": "transport", "co2_per_km": 0.05},
    "plastic_bottle": {"type": "product", "co2": 0.1},
    "laptop": {"type": "product", "co2": 200},
    "smartphone": {"type": "product", "co2": 70},
    "burger": {"type": "food", "co2": 5},
    "rice": {"type": "food", "co2": 2.7},
    "tshirt": {"type": "product", "co2": 6},
    "default": {"type": "product", "co2": 2}
}

recommendations = {
    "car": "Try a public bus, train, or bike to lower emissions.",
    "bike": "Great job! Keep biking and combine trips for more impact.",
    "bus": "Public transit is smart. Use it more and reduce solo car trips.",
    "walk": "Walking is the cleanest option. Keep choosing active transport.",
    "plastic_bottle": "Swap single-use plastic for reusable bottles and containers.",
    "laptop": "Keep your device for longer and power it efficiently.",
    "smartphone": "Limit charging cycles and reuse your phone longer.",
    "burger": "Choose more plant-based meals for a lower carbon diet.",
    "rice": "You can reduce impact further by eating more vegetables and grains.",
    "tshirt": "Buy less clothing and choose durable, sustainable brands.",
    "default": "Choose reusable, repairable, and lower-impact alternatives."
}

BASELINE_DAILY = 10.0
ELECTRICITY_CO2 = 0.92
FOOD_MEAL_MAP = {
    "veg": "rice",
    "non-veg": "burger"
}

KNOWN_OBJECTS = ["plastic_bottle", "laptop", "smartphone", "burger", "rice", "tshirt"]

TRANSPORT_RECOMMENDATIONS = {
    "car": "car",
    "bike": "bike",
    "bus": "bus",
    "walk": "walk"
}


def detect_object_from_filename(filename: str) -> str:
    text = filename.lower()
    if "bottle" in text:
        return "plastic_bottle"
    if "laptop" in text:
        return "laptop"
    if "phone" in text or "smart" in text:
        return "smartphone"
    if "burger" in text:
        return "burger"
    if "rice" in text:
        return "rice"
    if "tshirt" in text or "shirt" in text:
        return "tshirt"
    return random.choice(KNOWN_OBJECTS)


def detect_object_from_capture(image_data: str) -> str:
    return random.choice(KNOWN_OBJECTS)


def build_response(object_name: str, carbon_value: float, explanation: str, image_data: str = None):
    daily_carbon = round(carbon_value, 2)
    yearly_carbon = round(daily_carbon * 365, 2)
    trees_required = round(yearly_carbon / 21, 2)
    improved_carbon = round(max(daily_carbon * 0.7, 0), 2)
    pie_main = round(min(daily_carbon, BASELINE_DAILY), 2)
    pie_remaining = round(max(BASELINE_DAILY - pie_main, 0), 2)

    response = {
        "object_name": object_name,
        "carbon_value": daily_carbon,
        "yearly_value": yearly_carbon,
        "trees_required": trees_required,
        "pie_data": {
            "labels": ["Estimated carbon", "Remaining daily budget"],
            "values": [pie_main, pie_remaining]
        },
        "bar_data": {
            "labels": ["Current carbon", "Eco-friendly projection"],
            "values": [daily_carbon, improved_carbon]
        },
        "recommendation": recommendations.get(object_name, recommendations["default"]),
        "explanation": explanation
    }
    if image_data:
        response["image_data"] = image_data
    return response


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/result")
def result():
    return render_template("result.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    payload = request.json or {}
    transport_type = payload.get("transport_type", "car")
    transport_distance = float(payload.get("transport_distance", 0) or 0)
    electricity_usage = float(payload.get("electricity_usage", 0) or 0)
    food_habit = payload.get("food_habit", "veg")

    transport_factor = carbon_data.get(transport_type, {}).get("co2_per_km", 0.21)
    transport_co2 = transport_distance * transport_factor
    electricity_co2 = electricity_usage * ELECTRICITY_CO2
    food_key = FOOD_MEAL_MAP.get(food_habit, "rice")
    food_co2 = carbon_data.get(food_key, {}).get("co2", 2.7)

    total_co2 = transport_co2 + electricity_co2 + food_co2
    object_name = f"{transport_type} + {food_habit}"
    explanation = (
        f"Transport: {transport_distance} km × {transport_factor} kg/km, "
        f"Electricity: {electricity_usage} units × {ELECTRICITY_CO2} kg/unit, "
        f"Food choice: {food_key}."
    )

    result = build_response(object_name, total_co2, explanation)
    result["recommendation"] = (
        recommendations.get(transport_type) if transport_type in recommendations else recommendations.get(food_key)
    )
    return jsonify(result)


@app.route("/upload-image", methods=["POST"])
def upload_image():
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image uploaded."}), 400

    filename = image_file.filename or "capture.png"
    image_bytes = image_file.read()
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    image_data = f"data:{image_file.mimetype};base64,{encoded}"
    object_name = detect_object_from_filename(filename)
    co2_value = carbon_data.get(object_name, carbon_data["default"]).get("co2", 2)
    explanation = f"Simulated image recognition detected '{object_name}'. Carbon is estimated from the object lifecycle."

    result = build_response(object_name, co2_value, explanation, image_data=image_data)
    return jsonify(result)


@app.route("/capture-image", methods=["POST"])
def capture_image():
    payload = request.json or {}
    image_data = payload.get("image_data")
    if not image_data:
        return jsonify({"error": "No capture image received."}), 400

    object_name = detect_object_from_capture(image_data)
    co2_value = carbon_data.get(object_name, carbon_data["default"]).get("co2", 2)
    explanation = "Simulated camera analysis returned a best-guess item and estimated carbon impact."

    result = build_response(object_name, co2_value, explanation, image_data=image_data)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
