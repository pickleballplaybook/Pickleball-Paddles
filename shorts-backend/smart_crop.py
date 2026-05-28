#!/usr/bin/env python3
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import subprocess
import sys
import numpy as np
import urllib.request
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "pose_landmarker.task")

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("[smart_crop] Downloading pose model...")
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
        urllib.request.urlretrieve(url, MODEL_PATH)
        print("[smart_crop] Model downloaded.")

def smart_crop(input_path, output_path):
    download_model()
    print(f"[smart_crop] Analyzing person position in {input_path}")

    cap = cv2.VideoCapture(input_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    crop_w = int(height * 9 / 16)
    print(f"[smart_crop] Video: {width}x{height} @ {fps}fps, {total_frames} frames")

    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.4,
        min_pose_presence_confidence=0.4,
        min_tracking_confidence=0.4
    )

    positions = []
    sample_interval = max(1, total_frames // 100)
    frame_idx = 0

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % sample_interval == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                result = landmarker.detect(mp_image)
                if result.pose_landmarks:
                    xs = [lm.x for lm in result.pose_landmarks[0]]
                    if xs:
                        center_x = int(np.mean(xs) * width)
                        positions.append(center_x)
            frame_idx += 1

    cap.release()

    if not positions:
        print("[smart_crop] No person detected, falling back to center crop")
        center_x = width // 2
    else:
        center_x = int(np.median(positions))
        print(f"[smart_crop] Person at x={center_x} (median of {len(positions)} samples)")

    crop_x = max(0, min(center_x - crop_w // 2, width - crop_w))
    print(f"[smart_crop] Crop: x={crop_x}, w={crop_w}, h={height}")

    crop_filter = f"crop={crop_w}:{height}:{crop_x}:0,scale=1080:1920"
    cmd = [
        "ffmpeg", "-i", input_path,
        "-vf", crop_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        output_path, "-y"
    ]
    print("[smart_crop] Running ffmpeg crop...")
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[smart_crop] Done! Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 smart_crop.py input.mp4 output.mp4")
        sys.exit(1)
    smart_crop(sys.argv[1], sys.argv[2])
