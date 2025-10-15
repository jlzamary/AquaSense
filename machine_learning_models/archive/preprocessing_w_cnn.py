import pandas as pd
from pathlib import Path
import sys
print(sys.executable)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from PIL import Image
import tqdm
from CNN import CNN
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import DataLoader
from torch.utils.data import Dataset



# Path setup
dataset_dir = Path("C:/Users/ricks/Downloads/Data/Data/classification_dataset/images")
labels_file = Path("C:/Users/ricks/Downloads/Data/Data/classification_dataset/labels.txt")

# Read the text file (filename label)
df = pd.read_csv(labels_file, sep=" ", header=None, names=["filename", "label"])

# Add full path column
df["path"] = df["filename"].apply(lambda x: dataset_dir / x)


label_map = {
    "crab": 0,
    "Eel": 1,
    "flatfish": 2,
    "roundfish": 3,
    "Scallop": 4,
    "skate": 5,
    "whelk": 6
}


df['label_id'] = df['label'].map(label_map)


train_val_df, test_df = train_test_split(df, test_size=0.1, stratify=df["label_id"], random_state=42)

train_df, val_df = train_test_split(train_val_df, test_size=0.2, stratify=train_val_df["label_id"], random_state=42)


transform = transforms.Compose([
    transforms.ToTensor(),
])

class BenthicDataset(Dataset):
    def __init__(self, df, transform):
        self.df = df.reset_index(drop = True)
        self.transform = transform

    def __len__(self):
        return len(self.df)
    
    def __getitem__(self,idx):
        row = self.df.iloc[idx]
        image = Image.open(row['path'])
        label = row['label_id']
        image = self.transform(image)
        return image, label
    
train_dataset = BenthicDataset(train_df, transform)
val_dataset = BenthicDataset(val_df, transform)
test_dataset = BenthicDataset(test_df, transform)


train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32)
test_loader = DataLoader(test_dataset, batch_size = 32)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

startEpoch = 0
num_epochs = 100
model = CNN()

model = model.to(device)

# Loss function
criterion = nn.CrossEntropyLoss()  # expects integer labels

# Optimizer
optimizer = optim.Adam(model.parameters(), lr=1e-3)
def Trainer(model, criterion, optimizer, num_epochs):
    best_val_acc = 0.0 
    for epoch in range(num_epochs):
        loop = tqdm.tqdm(train_loader, total=len(train_loader), ncols=100, desc=f"Epoch {epoch+1}/{num_epochs}")
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in loop:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            loop.set_postfix(loss=running_loss/total, acc=correct/total)

        train_loss = running_loss/total
        train_acc = correct/total

        model.eval()
        val_correct = 0
        val_total = 0
        val_loss = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images)
                _,preds = torch.max(outputs,1)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)
        val_loss /= val_total
        val_acc = val_correct/total

        tqdm.write(f"Epoch {epoch+1}/{num_epochs} —  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc
            }, "best_model.pth")
            tqdm.write(f"Model saved at epoch {epoch+1} with Val Acc: {val_acc:.4f}")


Trainer(model=model, criterion=criterion, num_epochs=100, optimizer = optimizer)
