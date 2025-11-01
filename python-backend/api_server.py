"""
Flask API Server for WhatsApp Sender
Provides REST API endpoints for the React frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from whatsapp_sender import WhatsAppSender
from key_manager import validate_key, create_keys, list_keys
import os
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

sender = WhatsAppSender()

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'opus'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    """Get list of all profiles"""
    profiles = sender.list_profiles()
    profile_data = []

    for profile in profiles:
        stats = sender.get_profile_stats(profile)

        # Try to read phone from profile_info.json
        phone = "N/A"
        profile_info_path = os.path.join('profiles', profile, 'profile_info.json')
        if os.path.exists(profile_info_path):
            try:
                with open(profile_info_path, 'r') as f:
                    info = json.load(f)
                    phone = info.get('phone', 'N/A')
            except:
                pass

        profile_data.append({
            "name": profile,
            "messages_sent": stats.get("messages_sent", 0),
            "phone": phone
        })

    return jsonify({"profiles": profile_data})

@app.route('/api/profiles/create', methods=['POST'])
def create_profile():
    """Create a new profile"""
    data = request.json
    profile_name = data.get('name')

    if not profile_name:
        return jsonify({"error": "Profile name is required"}), 400

    result = sender.create_profile(profile_name)

    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/profile/<profile_name>/info', methods=['GET'])
def get_profile_info(profile_name):
    """Get detailed profile information"""
    try:
        # Check if profile exists
        profile_path = os.path.join('profiles', profile_name)
        if not os.path.exists(profile_path):
            return jsonify({"error": "Profile not found"}), 404
            
        info = sender.get_profile_info(profile_name)
        return jsonify(info)
    except Exception as e:
        print(f"Error getting profile info: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/profile/<profile_name>/stats', methods=['GET'])
def get_profile_stats(profile_name):
    """Get statistics for a specific profile"""
    stats = sender.get_profile_stats(profile_name)
    return jsonify(stats)

@app.route('/api/send', methods=['POST'])
def send_message():
    """Send a single message"""
    try:
        profile = request.form.get('profile')
        phone = request.form.get('phone')
        message = request.form.get('message', '')

        if not profile or not phone:
            return jsonify({"error": "Profile and phone are required"}), 400

        # Handle image upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                filename = secure_filename(file.filename)
                image_path = os.path.join(UPLOAD_FOLDER, f"img_{profile}_{filename}")
                file.save(image_path)
                print(f"Image saved to: {image_path}")

        # Handle audio upload
        audio_path = None
        if 'audio' in request.files:
            file = request.files['audio']
            if file and file.filename and allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
                filename = secure_filename(file.filename)
                audio_path = os.path.join(UPLOAD_FOLDER, f"audio_{profile}_{filename}")
                file.save(audio_path)
                print(f"Audio saved to: {audio_path}")

        result = sender.send_message(profile, phone, message, image_path, audio_path)

        # Clean up uploaded files after sending
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except:
                pass
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass

        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

@app.route('/api/mass-send', methods=['POST'])
def mass_send():
    """Mass send messages"""
    try:
        phone_numbers = json.loads(request.form.get('phone_numbers', '[]'))
        profiles_config = json.loads(request.form.get('profiles_config', '{}'))
        delay_config = json.loads(request.form.get('delay_config', '{"random": false, "delay": 30}'))

        if not phone_numbers or not profiles_config:
            return jsonify({"error": "Phone numbers and profiles configuration are required"}), 400

        # Handle image uploads for each profile
        profile_images = {}
        for profile in profiles_config.keys():
            file_key = f'image_{profile}'
            if file_key in request.files:
                file = request.files[file_key]
                if file and file.filename and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    filename = secure_filename(file.filename)
                    image_path = os.path.join(UPLOAD_FOLDER, f"img_{profile}_{filename}")
                    file.save(image_path)
                    profile_images[profile] = image_path

        # Handle audio uploads for each profile
        profile_audios = {}
        for profile in profiles_config.keys():
            file_key = f'audio_{profile}'
            if file_key in request.files:
                file = request.files[file_key]
                if file and file.filename and allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
                    filename = secure_filename(file.filename)
                    audio_path = os.path.join(UPLOAD_FOLDER, f"audio_{profile}_{filename}")
                    file.save(audio_path)
                    profile_audios[profile] = audio_path

        result = sender.mass_send(
            phone_numbers,
            profiles_config,
            delay_config,
            profile_images if profile_images else None,
            profile_audios if profile_audios else None
        )

        # Clean up uploaded files after sending
        for path in profile_images.values():
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass
        for path in profile_audios.values():
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass

        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data"""
    stats = sender.load_stats()
    
    # Calculate success rate
    total = stats['total_sent']
    success_rate = (stats['total_delivered'] / total * 100) if total > 0 else 0
    
    # Calculate average delay (mock for now)
    avg_delay = 35  # seconds
    
    return jsonify({
        "sent": stats['total_sent'],
        "delivered": stats['total_delivered'],
        "failed": stats['total_failed'],
        "success_rate": round(success_rate, 1),
        "avg_delay": avg_delay,
        "recent_messages": stats['recent_messages']
    })

# Access key management endpoints
@app.route('/api/keys/validate', methods=['POST'])
def validate_access_key():
    """Validate an access key"""
    try:
        data = request.json
        key = data.get('key')
        
        if not key:
            return jsonify({"valid": False, "message": "Ключ не указан"}), 400
        
        print(f"API: Validating key: {key}")
        result = validate_key(key)
        print(f"API: Validation result: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"API: Error validating key: {str(e)}")
        return jsonify({"valid": False, "message": f"Ошибка сервера: {str(e)}"}), 500

@app.route('/api/keys/generate', methods=['POST'])
def generate_keys():
    """Generate new access keys (admin only)"""
    data = request.json
    count = data.get('count', 1)
    
    keys = create_keys(count)
    return jsonify({"keys": keys})

@app.route('/api/keys/list', methods=['GET'])
def get_keys():
    """List all keys (admin only)"""
    keys_data = list_keys()
    return jsonify(keys_data)

@app.route('/api/check-numbers', methods=['POST'])
def check_numbers():
    """Check if phone numbers are registered on WhatsApp"""
    try:
        data = request.json
        profile_name = data.get('profile_name')
        phone_numbers = data.get('phone_numbers', [])
        
        if not profile_name:
            return jsonify({
                "success": False,
                "message": "Profile name is required",
                "registered": [],
                "unregistered": []
            }), 400
        
        if not phone_numbers:
            return jsonify({
                "success": False,
                "message": "Phone numbers are required",
                "registered": [],
                "unregistered": []
            }), 400
        
        result = sender.check_numbers(profile_name, phone_numbers)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "success": False, 
            "message": f"Server error: {str(e)}",
            "registered": [],
            "unregistered": []
        }), 500

if __name__ == '__main__':
    print("Starting WhatsApp Sender API Server...")
    print("Server running on http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /api/health           - Health check")
    print("  GET  /api/profiles         - List all profiles")
    print("  POST /api/profiles/create  - Create new profile")
    print("  GET  /api/profile/<name>/info  - Get profile details")
    print("  POST /api/send             - Send single message")
    print("  POST /api/mass-send        - Send to multiple recipients")
    print("  GET  /api/analytics        - Get analytics data")
    print("\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
