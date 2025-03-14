from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes import api

# Initialize Flask App
app = Flask(__name__)
app.config.from_object(Config)

# Initialize Extensions
CORS(app)
db.init_app(app)
jwt = JWTManager(app)

# Register Routes
app.register_blueprint(api, url_prefix="/api")

# Debugging: Print logs when the first request is made
@app.before_request
def startup_message():
    print("\n🚀 Flask Server is Running...")
    print(f"🔹 Running on: http://127.0.0.1:5001/")
    print(f"🔹 Database Connected: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"🔹 Debug Mode: {app.debug}\n")

# Create Database Tables
with app.app_context():
    db.create_all()
    print("✅ Database Tables Created (if not exist)")

# Run the Server on Port 5001
if __name__ == "__main__":
    print("\n🔥 Starting Flask Server...")
    app.run(debug=True, host="0.0.0.0", port=5001)
