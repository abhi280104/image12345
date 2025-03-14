from flask import Blueprint, request, jsonify
from PIL import Image as PILImage 
from flask import Flask
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import boto3
import google.generativeai as genai
import requests
from io import BytesIO 
import os
from werkzeug.utils import secure_filename
from models import db, User, Image  # Ensure Image model is imported

# Create a Blueprint (modular approach)
app = Flask(__name__)
CORS(app)
api = Blueprint("api", __name__)

# AWS S3 Setup
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
    region_name=os.getenv("S3_REGION")
)

BUCKET_NAME = os.getenv("S3_BUCKET")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------------
# ✅ User Authentication Routes
# -----------------------------------

# 🔹 User Registration


@api.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

# 🔹 User Login


@api.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=email, expires_delta=timedelta(days=1))
    return jsonify({"token": access_token}), 200

# 🔹 Protected Route Example


@api.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"message": f"Hello, {current_user}!"})

# -----------------------------------
# ✅ Image Upload Route
# -----------------------------------


@api.route("/upload", methods=["POST"])
@jwt_required()
def upload_image():
    """Uploads an image securely to AWS S3 with private access and stores metadata in DB."""
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["file"]

    # ✅ Prevent empty filename
    if file.filename == "":
        return jsonify({"message": "Invalid file name"}), 400

    # ✅ Secure filename and generate file path
    file_name = secure_filename(file.filename)
    # ✅ Store images in user-specific folder
    file_path = f"user_{user.id}/{file_name}"

    try:
        # ✅ Upload file to S3 with private ACL
        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            file_path,
            ExtraArgs={"ContentType": file.content_type, "ACL": "private"}
        )

        # ✅ Store metadata in the database
        file_url = f"s3://{BUCKET_NAME}/{file_path}"  # Store S3 file path
        new_image = Image(file_name=file_path,
                          file_url=file_url, user_id=user.id)
        db.session.add(new_image)
        db.session.commit()

        return jsonify({
            "message": "Upload successful",
            "uploaded_path": file_path,
            "file_url": file_url
        }), 200

    except Exception as e:
        return jsonify({"message": "Upload failed", "error": str(e)}), 500

# -----------------------------------
# ✅ Image Retrieval Route (Private)
# -----------------------------------


@api.route("/images", methods=["GET"])
@jwt_required()
def get_user_images():
    """Retrieves user's uploaded images with pre-signed URLs."""
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Fetch images uploaded by the logged-in user
    images = Image.query.filter_by(user_id=user.id).all()
    
    if not images:
        return jsonify({"images": []})  # ✅ Return empty list if no images found

    image_data = []

    for img in images:
        try:
            # Generate a pre-signed URL (valid for 1 hour)
            presigned_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET_NAME, "Key": img.file_name},
                ExpiresIn=3600,
            )
            image_data.append({"url": presigned_url, "file_name": img.file_name})  # ✅ Fix response format
        except Exception as e:
            print(f"❌ Error generating URL for {img.file_name}: {str(e)}")

    return jsonify({"images": image_data})


@api.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_image():
    """Downloads an image and sends it to Gemini 2.0 for analysis."""
    data = request.json
    image_url = data.get("image_url")
    

    if not image_url:
        return jsonify({"message": "No image URL provided"}), 400

    try:
        # 🔹 Step 1: Download the Image
        response = requests.get(image_url, timeout=10)
        if response.status_code != 200:
            return jsonify({"message": "Failed to fetch image"}), 400

        img_data = BytesIO(response.content)
        img = PILImage.open(img_data)
        img = img.convert("RGB")

        # 🔹 Step 2: Send Image to Gemini API for Analysis
        model = genai.GenerativeModel("gemini-1.5-flash") 
        prompt = "Describe the objects and scenes in this image in detail." #improved prompt
        response = model.generate_content([prompt, img]) 
        

        # Extract AI-generated description
        analysis = response.text if response else "No analysis available."

        return jsonify({"analysis": analysis})

    except requests.exceptions.RequestException as e:
        return jsonify({"message": "Error downloading image", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"message": "Error analyzing image", "error": str(e)}), 500