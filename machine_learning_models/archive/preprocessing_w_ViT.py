import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from PIL import Image
from tqdm import tqdm
import torch
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import DataLoader
from torch.utils.data import Dataset
import einops
from einops.layers.torch import Rearrange



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

class FF(nn.Module):
    def __init__(self,embed_dim, mlp_scale : int = 2, drop_rate: float = 0.0):
        super().__init__()
        self.fc1 = nn.Linear(embed_dim,embed_dim * mlp_scale)
        self.activation = nn.GELU()
        self.fc2 = nn.Linear(embed_dim * mlp_scale, embed_dim)
        self.dropout = nn.Dropout(p = drop_rate)


    def forward(self,x):
        x = self.activation(self.fc1(x))
        x = self.dropout(self.fc2(x))
        
        return x
    
class MHSA(nn.Module):
    def __init__(self, embed_dim, num_heads, seq_len=250, dropout=0.2,device='cpu'):
        super().__init__()

        assert embed_dim % num_heads == 0, "embed_dim is indivisible by num_heads"

        self.num_heads = num_heads
        self.seq_length = seq_len
        self.head_dim = embed_dim // num_heads
        self.d_k = self.head_dim ** 0.5
        self.device = device
        # Create the projections for Q,K,V
        self.k_proj = nn.Linear(embed_dim, embed_dim) 
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.dropout = nn.Dropout(dropout)


    def forward(self, x,attn_mask=None,key_padding_mask=None,need_weights=False):
        batch_size, seq_len, embed_dim = x.shape

        # Project input x to queries, keys, and values
        q = self.q_proj(x)
        k = self.k_proj(x)
        v = self.v_proj(x)

        # We want multi-head attention - typically this is done through reshaping our output
        # This is implicit concatenation - equivalent
        k = k.view(batch_size, seq_len, self.num_heads, self.head_dim)
        v = v.view(batch_size, seq_len, self.num_heads, self.head_dim)
        q = q.view(batch_size, seq_len, self.num_heads, self.head_dim)

        # Transpose to align axis for computation of attention scores per head
        # (batch,seq_len,num_heads,head_dim) -> (batch,num_heads,seq_len,head_dim)
        k = k.transpose(1, 2)
        q = q.transpose(1, 2)
        v = v.transpose(1, 2)

        # Compute the attention scores with matrix operations - this is the argument of the softmax QK^T / sqrt(d_k)
        # again we need to be careful with the dimensions of K after we transpose
        # K is of shape (batch, num_heads, seq_len, head_dim)
        # Q is of shape (batch, num_heads, seq_len, head_dim)
        # To compute Q @ K^T, we need to transpose the last two dimensions of K so that:
        # K.transpose(2, 3) gives shape (batch, num_heads, head_dim, seq_len)
        # Resulting attn_scores shape: (batch, num_heads, seq_len, seq_len)
        # Each attention head now contains a full pairwise similarity matrix between all tokens
        # We also need to divide by self.d_k for normalization constant!
        attn_scores = (q @ k.transpose(2, 3)) / self.d_k

        if attn_mask is not None:
            attn_scores.masked_fill_(attn_mask,-torch.inf)

        
        if key_padding_mask is not None:
            key_padding_mask = key_padding_mask[:, None, None, :]
            attn_scores.masked_fill_(key_padding_mask,-torch.inf)

        # Compute the softmax over our attention scores.
        attn_scores = F.softmax(attn_scores,dim = -1)

        # Apply dropout
        attn_scores = self.dropout(attn_scores)

        # Now we have our attention weights in the form softmax(QK^T / sqrt(d_k))
        # Your next task is to apply these attention weights to the Value matrix V.
        # This means performing a batched matrix multiplication between attn_scores and v.
        # attn_scores shape: (batch, num_heads, seq_len, seq_len)
        # v shape:           (batch, num_heads, seq_len, head_dim)
        # The result should be of shape: (batch, num_heads, seq_len, head_dim)
        # Fill in this line with the correct matrix multiplication
        attn_output = attn_scores @ v

        # Now you need to rearrange the output so that the num_heads dimension is moved after the seq_len.
        # attn_output is currently shaped: (batch, num_heads, seq_len, head_dim)
        # You want to transpose it to: (batch, seq_len, num_heads, head_dim)
        # This will prepare it to be reshaped into the original embedding dimension.
        attn_output = attn_output.transpose(1, 2)

        # Finally, flatten the last two dimensions (num_heads and head_dim) back into a single embedding dimension.
        # The final output should be of shape: (batch, seq_len, embed_dim), where embed_dim = num_heads * head_dim
        attn_output = attn_output.contiguous().view(batch_size,seq_len,embed_dim)

        if need_weights:
            return attn_output,attn_scores
        else:
            return attn_output,None
        
class EncoderBlock(nn.Module):
    def __init__(self,embed_dim,num_heads, mlp_scale : int = 2,drop_rate: float = 0.2, device='cpu'):
        super().__init__()

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.device = device
        self.mlp_scale = mlp_scale
        self.drop_rate = drop_rate

        self.LN1 = nn.LayerNorm(embed_dim)
        # Each EncoderBlock will need the attention mechanism we created above
        self.attn = MHSA(embed_dim = self.embed_dim, num_heads=self.num_heads, dropout = self.drop_rate, device = self.device)
        # We are going to use an (optional linear projection after the attention)
        self.c_proj = nn.Linear(self.embed_dim, self.embed_dim, bias=False)
        # We need our second layernorm - same as above
        self.LN2 = nn.LayerNorm(embed_dim)
        # We need our feed forward network that we created above
        self.FF = FF(embed_dim = self.embed_dim, mlp_scale = self.mlp_scale, drop_rate = self.drop_rate)


    # We will not use this function
    # This dnymically creates the mask for masked attention
    def generate_mask(self,seq_len):
        return torch.triu(torch.ones((seq_len, seq_len), device=self.device, dtype=torch.bool), diagonal=1)

    def forward(self, x,padding_mask=None,need_weights=False):
        B,N_t,t_dim = x.shape
        # We are going to deploy a pre norm strategy
        x_norm = self.LN1(x)

        # We pass this to our attention block
        attn,attn_weights = self.attn(x)

        attn = self.c_proj(attn) # Optional projection layer - done for you

        # Now we need to operform the addition and residual connections
        x = x + attn
        # Now lets do the residual connection
        res = self.FF(self.LN2(x))
        # Now add the residual part back to x
        x = x + res
        return x
    
class ViT(nn.Module):
    def __init__(self, image_size, patch_size, embed_dim, num_classes=10,
                 attn_heads=[2, 4, 2], mlp_scale: int = 2, drop_rates=[0.0, 0.0, 0.0], device='cpu'):
        super().__init__()

        # Ensure drop_rates and attn_heads lists are consistent
        assert len(drop_rates) == len(attn_heads), "drop_rates and attn_heads must be of same length"
        # Ensure the image dimensions are divisible by the patch size
        assert image_size[1] % patch_size == 0 and image_size[2] % patch_size == 0, \
            'image dimensions must be divisible by the patch size'

        channels = image_size[0]
        # Compute the number of patches by dividing the height and width by patch size
        num_patches = (image_size[1] // patch_size) * (image_size[2] // patch_size)
        # Each patch is flattened into a vector of size (channels * patch_size^2)
        patch_dim = channels * patch_size ** 2
        self.device = device

        # Patch embedding layer:
        # 1. Rearranges the image into a sequence of flattened patches
        # 2. Applies LayerNorm to each patch
        # 3. Projects to the embedding dimension using a Linear layer
        # 4. Applies another LayerNorm
        self.patch_embedding = nn.Sequential(
            Rearrange("b c (h p1) (w p2) -> b (h w) (p1 p2 c)", p1=patch_size, p2=patch_size),
            nn.LayerNorm(patch_dim),
            nn.Linear(patch_dim, embed_dim),
            nn.LayerNorm(embed_dim),
        )

        # Positional embedding to retain spatial information (learned parameter)
        # Shape: (1, num_patches + 1, embed_dim); +1 for the [CLS] token
        self.pos_embedding = nn.Parameter(torch.randn(1, num_patches + 1, embed_dim))

        # Create a list of transformer encoder blocks, each with a different number of attention heads
        # and optional dropout
        layers_ = [
            EncoderBlock(embed_dim, attn_heads[i], mlp_scale, drop_rate=drop_rates[i])
            for i in range(len(attn_heads))
        ]
        self.layers = nn.ModuleList(layers_)

        # Classification head to project the [CLS] token's embedding to logits for each class
        self.mlp_head = nn.Linear(embed_dim, num_classes)

        # Learnable [CLS] token used for classification
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))

    def forward(self, x, padding_mask=None):
        batch_size = x.size(0)

        # Convert image into a sequence of embedded patches
        x = self.patch_embedding(x)  # Shape: (B, num_patches, embed_dim)

        # Expand the [CLS] token to match the batch size
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)  # Shape: (B, 1, embed_dim)

        # Prepend the [CLS] token to the patch embeddings
        x = torch.cat((cls_tokens, x), dim=1)  # Shape: (B, num_patches + 1, embed_dim)

        # Add positional embeddings
        x = x + self.pos_embedding[:, :x.size(1)]  # Shape: (B, num_patches + 1, embed_dim)

        # Pass through the stack of transformer encoder blocks
        for layer in self.layers:
            x = layer(x)

        # Use the [CLS] token's output for classification
        return self.mlp_head(x[:, 0])  # Shape: (B, num_classes)

image_size = [3,640,640]
patch_size = 32 # Patch size - grab patch x patch pixels to form an element in the sequence
embed_dim = 64 # embedding dimension - each patch is projected in a space of dim = embed_dim
mlp_scale = 2 # instead of specifying the MLP dimensions explicitly, scale it based off of embed_dim
drop_rates = [0.0,0.0,0.0] # applied for each encoderblock
attn_heads = [2,2,2] # 3 encoder blocks, each with 2 heads -> embed_dim // attn_heads[i] should = 0
num_classes = 7
model = ViT(image_size,patch_size,embed_dim,num_classes=num_classes,attn_heads=attn_heads,mlp_scale=mlp_scale,drop_rates=drop_rates,device=device)
t_params = sum(p.numel() for p in model.parameters())
print("Network Parameters: ",t_params)
model.to(device)

num_epochs = 20
criterion = nn.CrossEntropyLoss()  # expects integer labels

# Optimizer
optimizer = optim.Adam(model.parameters(), lr=1e-3)
def Trainer(model, criterion, optimizer, num_epochs):
    best_val_acc = 0.0 
    for epoch in range(num_epochs):
        loop = tqdm(train_loader, total=len(train_loader), ncols=100, desc=f"Epoch {epoch+1}/{num_epochs}")
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

        loop.write(f"Epoch {epoch+1}/{num_epochs} —  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc
            }, "best_model.pth")
            tqdm.write(f"Model saved at epoch {epoch+1} with Val Acc: {val_acc:.4f}")

Trainer(model=model, criterion=criterion, num_epochs=20, optimizer = optimizer)
