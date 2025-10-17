## File Metadata and Process Information 
pretrained_cnn.py: Uses a pretrained convolutional neural network (resnet50) as backbone than modifies output through the use a dense layer to get desired output. Parameters in the pretrained model don't get trained until after 5th epoch. This is used for task #1

load_checkpoint.py, Evaluate_model.ipynb: Files that I use to evaluate my model for task 1.

new_best.pt: Stores the weights from the epoch with the best precision and recall from my yolov8.n model.

