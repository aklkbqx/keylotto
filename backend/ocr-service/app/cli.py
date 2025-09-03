import sys, json, io, os
import easyocr
from PIL import Image
import cv2
import numpy as np
from contextlib import redirect_stdout, redirect_stderr

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "image path required"}))
        return 1
    image_path = sys.argv[1]
    # Suppress model download/progress logs to keep stdout as pure JSON
    buf = io.StringIO()
    with redirect_stdout(buf), redirect_stderr(buf):
        # Read and preprocess image to emphasize dark digits
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            print(json.dumps({"success": False, "error": "cannot read image"}))
            return 1
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        # Morphological black-hat to highlight dark text on light background
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
        # Adaptive threshold to binarize
        th = cv2.adaptiveThreshold(blackhat, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 35, -10)
        # Slight blur to reduce noise
        th = cv2.medianBlur(th, 3)
        # Upscale to help OCR on small fonts
        scale = 1.5
        th = cv2.resize(th, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        reader = easyocr.Reader(['en'], gpu=False)
        result = reader.readtext(th)
    tickets = []
    for item in result:
        box, text, score = item
        digits = ''.join([c for c in text if c.isdigit()])
        for i in range(0, len(digits) - 5):
            cand = digits[i:i+6]
            if cand.isdigit() and len(cand) == 6:
                xs = [p[0] for p in box]
                ys = [p[1] for p in box]
                x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
                tickets.append({
                    "number": cand,
                    "confidence": float(score) * 100.0,
                    "box": {"x": float(x0), "y": float(y0), "w": float(x1 - x0), "h": float(y1 - y0)}
                })
    best = {}
    for t in tickets:
        n = t["number"]
        if n not in best or t["confidence"] > best[n]["confidence"]:
            best[n] = t
    print(json.dumps({"success": True, "data": list(best.values())}))
    return 0

if __name__ == "__main__":
    sys.exit(main())


