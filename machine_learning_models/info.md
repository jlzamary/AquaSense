## File Metadata and Process Information 
pretrained_cnn.py: uses a pretrained convolutional neural network (resnet50) as backbone than modifies output through the use a dense layer to get desired output. Parameters in the pretrained model don't get trained until after 5th epoch. This is used for task #1
preprocessing_w_ViT.py: Our vision transformer model(manually trained), it did not achieve above 0.6 validation accuracy
preprocessing_w_cnn.py: Our manually trained covulitional nueral network model, took too long to converge for us to reasonably run
