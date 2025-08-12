import cv2
import numpy as np
import os

import tensorflow as tf
from statistics import *
from keras.preprocessing.image import img_to_array
from tensorflow.keras.activations import softmax


def getContours(img, original_img):
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        print(area)
        if area > 60000:
            cv2.drawContours(original_img, cnt, -1, (0, 255, 0), 3)

            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

            ax = approx.item(0)
            ay = approx.item(1)
            bx = approx.item(2)
            by = approx.item(3)
            cx = approx.item(4)
            cy = approx.item(5)
            dx = approx.item(6)
            dy = approx.item(7)

            width, height = 900, 900

            pts1 = np.float32([[bx, by], [ax, ay], [cx, cy], [dx, dy]])
            pts2 = np.float32([[0, 0], [width, 0], [0, height], [width, height]])

            matrix = cv2.getPerspectiveTransform(pts1, pts2)
            img_perspective = cv2.warpPerspective(original_img, matrix, (width, height))
            img_corners = cv2.cvtColor(img_perspective, cv2.COLOR_BGR2GRAY)

            # Threshold manually
            for x in range(900):
                for y in range(900):
                    if img_corners[x][y] < 100:
                        img_corners[x][y] = 0
                    else:
                        img_corners[x][y] = 255

            return classify(img_corners)


os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # optional: hide TF info logs

# Get the absolute path to the current file's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build the path to the models folder
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "sudoku_model.keras")

model = tf.keras.models.load_model(MODEL_PATH, custom_objects={"softmax_v2": softmax})

def classify(img):
    crop_value = 10
    digits_list =[]
    
    for i in range(9):
        for j in range(9):
            J = j + 1
            I = i + 1

            cell = img[
                I * 100 - 100 + crop_value : I * 100 - crop_value,
                J * 100 - 100 + crop_value : J * 100 - crop_value
            ]

            img_canny = cv2.Canny(cell,50,50)

            contours, hierachy = cv2.findContours(img_canny,cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

            digit =0
            prob = 1.0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area>5:
                       
                    peri = cv2.arcLength(cnt,True)
                    approx = cv2.approxPolyDP(cnt, 0.02*peri, True)

                    x,y,w,h = cv2.boundingRect(approx)
                    image_rect = cell[y:y+h , x:x+w]
                    image_rect = cv2.resize(image_rect, (100,100))

                    image_num = img_to_array(image_rect)

                    image_num = np.array(image_num).reshape(-1,100,100,1)
                    image_num = image_num.astype('float32')
                    image_num = image_num/255.0
                    
                    prediction = model.predict(image_num, verbose=0)
                    digit = int(np.argmax(prediction, axis=-1)[0])
                    prob = float(np.max(prediction))
                    # plt.imshow(image_rect, cmap='gray')
                    # plt.show()
            print("Detected: ",digit)
            print("Probability: ",prob)
            digits_list.append(digit)
    return digits_list

def extract_grid(image):
    img = cv2.resize(image, (640, 480))

    # Preprocess the image
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 3)
    imgCanny = cv2.Canny(imgBlur, 50, 50)
    img_copy = img.copy()

    # Call the function
    return getContours(imgCanny, img_copy)

# cv2.imshow('Original Image', img_copy)
# cv2.waitKey(0)
# cv2.destroyAllWindows()