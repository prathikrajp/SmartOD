import cv2
import numpy as np

def erase_white_background():
    # Load the logo
    img = cv2.imread('public/new_logo.png', cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Logo not found at public/new_logo.png")
        return

    # If no alpha channel, add one
    if img.shape[2] == 3:
        b, g, r = cv2.split(img)
        a = np.ones(b.shape, dtype=b.dtype) * 255
        img = cv2.merge([b, g, r, a])
    else:
        b, g, r, a = cv2.split(img)

    # Convert to HSV to better isolate the white areas
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)
    
    # Define range for "white"
    # White has low saturation and high value
    lower_white = np.array([0, 0, 200])   # hue, saturation, value
    upper_white = np.array([180, 40, 255])
    
    white_mask = cv2.inRange(hsv, lower_white, upper_white)
    
    # Use the mask to set alpha to 0 for white areas
    a[white_mask > 0] = 0
    
    # Merge channels back
    result = cv2.merge([b, g, r, a])
    
    cv2.imwrite('public/new_logo_transparent.png', result)
    print("Saved transparent logo to public/new_logo_transparent.png")

if __name__ == "__main__":
    erase_white_background()
