from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    
    # Relationship: A user can have multiple images
    images = db.relationship('Image', backref='user', lazy=True)

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)  # Name of the uploaded file
    file_url = db.Column(db.String(500), nullable=False)  # URL of the stored image in S3
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)  # Auto-generated upload date
    
    # Foreign Key linking image to a user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
