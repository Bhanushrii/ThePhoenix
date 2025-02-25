# app.py
from flask import Flask, jsonify
import subprocess

app = Flask(__name__)

@app.route('/run-yolo', methods=['GET'])
def run_yolo():
    try:
        # Adjust the path to your YOLO detection script file
        subprocess.Popen(["python", r"C:\Users\sudhanva\Downloads\cv-waste-water.py"])
        return jsonify({"message": "YOLO script started!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 (you can choose another available port if needed)
    app.run(port=5001, debug=True)
