import { useState, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Button, 
  useToast,
  HStack,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Progress,
  Badge,
  SimpleGrid,
  Image,
  Card,
  CardBody,
  CardFooter,
  useColorModeValue
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaImage, FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Prediction {
  species: string;
  confidence: number;
  bbox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface UploadedFile extends File {
  preview?: string;
  uploadProgress?: number;
  uploadComplete?: boolean;
  error?: string;
  prediction?: Prediction | null;
}

// Mock function to simulate API call to your FastAPI backend
const analyzeImage = async (imageUrl: string): Promise<Prediction> => {
  // In a real implementation, you would call your FastAPI endpoint here
  // Example:
  // const response = await fetch('YOUR_FASTAPI_ENDPOINT/analyze', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ image_url: imageUrl })
  // });
  // return await response.json();
  
  // Mock response for development
  const speciesList = ['Scallop', 'Roundfish', 'Crab', 'Whelk', 'Skate', 'Flatfish', 'Eel'];
  const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
  const confidence = Math.random() * 0.5 + 0.5; // Random confidence between 0.5 and 1.0
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        species: randomSpecies,
        confidence: parseFloat(confidence.toFixed(2)),
        bbox: {
          x1: Math.random() * 0.6,
          y1: Math.random() * 0.6,
          x2: Math.random() * 0.4 + 0.6,
          y2: Math.random() * 0.4 + 0.6
        }
      });
    }, 1500);
  });
};

const Analysis = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      preview: URL.createObjectURL(file),
      uploadProgress: 0,
      uploadComplete: false,
      error: undefined,
      prediction: null
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 10,
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const removedFile = newFiles.splice(index, 1)[0];
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return newFiles;
    });
  };

  const uploadFile = async (file: UploadedFile, index: number) => {
    if (!currentUser) return;
    
    const storageRef = ref(storage, `uploads/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = { ...newFiles[index], uploadProgress: progress };
            return newFiles;
          });
        },
        (error) => {
          console.error('Upload error:', error);
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = { 
              ...newFiles[index], 
              error: 'Upload failed. Please try again.',
              uploadProgress: 0 
            };
            return newFiles;
          });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setFiles(prevFiles => {
              const newFiles = [...prevFiles];
              newFiles[index] = { 
                ...newFiles[index], 
                uploadProgress: 100, 
                uploadComplete: true 
              };
              return newFiles;
            });
            
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  };

  const analyzeFiles = async () => {
    if (!currentUser || files.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    
    try {
      // Upload all files first
      const uploadPromises = files.map((file, index) => uploadFile(file, index));
      const downloadURLs = await Promise.all(uploadPromises);
      
      // Analyze each file
      const analysisPromises = downloadURLs.map(async (url, index) => {
        try {
          const prediction = await analyzeImage(url);
          
          // Save analysis to Firestore
          await addDoc(collection(db, 'analyses'), {
            userId: currentUser.uid,
            imageUrl: url,
            species: prediction.species,
            confidence: prediction.confidence,
            timestamp: serverTimestamp(),
            bbox: prediction.bbox
          });
          
          // Update UI with prediction
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = { 
              ...newFiles[index], 
              prediction 
            };
            return newFiles;
          });
          
          return { success: true };
        } catch (error) {
          console.error('Analysis error:', error);
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = { 
              ...newFiles[index], 
              error: 'Analysis failed' 
            };
            return newFiles;
          });
          return { success: false, error };
        }
      });
      
      await Promise.all(analysisPromises);
      setAnalysisComplete(true);
      
      toast({
        title: 'Analysis Complete',
        description: 'Your images have been analyzed successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error during analysis:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during analysis. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSpeciesBadgeColor = (species: string) => {
    const colors: Record<string, string> = {
      scallop: 'green',
      roundfish: 'blue',
      crab: 'orange',
      whelk: 'purple',
      skate: 'pink',
      flatfish: 'teal',
      eel: 'yellow'
    };
    return colors[species.toLowerCase()] || 'gray';
  };

  const openImagePreview = (previewUrl: string) => {
    setSelectedImage(previewUrl);
    onOpen();
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Image Analysis</Heading>
          <Text color="gray.500">
            Upload underwater images to identify benthic species using our AI model.
          </Text>
        </Box>
        
        {/* Dropzone */}
        <Box
          {...getRootProps()}
          borderWidth={2}
          borderStyle="dashed"
          borderColor={isDragActive ? 'brand.400' : 'gray.300'}
          borderRadius="lg"
          p={10}
          textAlign="center"
          bg={isDragActive ? 'brand.50' : 'transparent'}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ borderColor: 'brand.300' }}
        >
          <input {...getInputProps()} />
          <VStack spacing={4}>
            <Icon as={FaUpload} boxSize={8} color="brand.500" />
            <Box>
              <Text fontWeight="medium" fontSize="lg">
                {isDragActive ? 'Drop the files here' : 'Drag & drop images here, or click to select files'}
              </Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Supports JPG, JPEG, PNG (max 10MB each)
              </Text>
            </Box>
          </VStack>
        </Box>
        
        {/* Uploaded files */}
        {files.length > 0 && (
          <Box>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="medium">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </Text>
              <Button
                colorScheme="brand"
                onClick={analyzeFiles}
                isLoading={isAnalyzing}
                loadingText="Analyzing..."
                leftIcon={<FaImage />}
                isDisabled={files.some(f => !f.uploadComplete && !f.error)}
              >
                {analysisComplete ? 'Re-analyze' : 'Analyze Images'}
              </Button>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
              {files.map((file, index) => (
                <Card 
                  key={index} 
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={cardBg}
                >
                  <Box 
                    position="relative" 
                    h="120px" 
                    bg="gray.100"
                    cursor="pointer"
                    onClick={() => file.preview && openImagePreview(file.preview)}
                  >
                    <Image
                      src={file.preview}
                      alt={file.name}
                      objectFit="cover"
                      w="100%"
                      h="100%"
                    />
                    {file.uploadProgress && file.uploadProgress < 100 && (
                      <Box position="absolute" bottom={0} left={0} right={0} p={2}>
                        <Progress 
                          value={file.uploadProgress} 
                          size="xs" 
                          colorScheme="brand"
                          borderRadius="full"
                        />
                      </Box>
                    )}
                    {file.uploadComplete && !file.prediction && !file.error && (
                      <Box 
                        position="absolute" 
                        top={2} 
                        right={2} 
                        bg="green.500" 
                        color="white" 
                        p={1} 
                        borderRadius="full"
                      >
                        <Icon as={FaCheck} boxSize={3} />
                      </Box>
                    )}
                    {file.error && (
                      <Box 
                        position="absolute" 
                        top={0} 
                        left={0} 
                        right={0} 
                        bottom={0} 
                        bg="rgba(0,0,0,0.7)" 
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        textAlign="center"
                        p={2}
                      >
                        <Text fontSize="xs" fontWeight="bold">Error: {file.error}</Text>
                      </Box>
                    )}
                  </Box>
                  
                  <CardBody p={3}>
                    <Text 
                      fontSize="xs" 
                      fontWeight="medium" 
                      noOfLines={1} 
                      title={file.name}
                      mb={1}
                    >
                      {file.name}
                    </Text>
                    
                    {file.prediction && (
                      <VStack align="start" spacing={1} mt={2}>
                        <Badge 
                          colorScheme={getSpeciesBadgeColor(file.prediction.species)}
                          fontSize="0.6rem"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {file.prediction.species}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          Confidence: {Math.round(file.prediction.confidence * 100)}%
                        </Text>
                      </VStack>
                    )}
                  </CardBody>
                  
                  <CardFooter p={2} pt={0}>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      leftIcon={<FaTimes />}
                    >
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
        
        {/* Analysis Results */}
        {analysisComplete && files.some(f => f.prediction) && (
          <Box mt={8}>
            <Heading size="lg" mb={4}>Analysis Results</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {files.filter(f => f.prediction).map((file, index) => (
                <Card key={index} borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                  <CardBody>
                    <HStack spacing={4}>
                      <Box 
                        flexShrink={0} 
                        w="100px" 
                        h="80px" 
                        bg="gray.100" 
                        borderRadius="md"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => file.preview && openImagePreview(file.preview)}
                      >
                        <Image
                          src={file.preview}
                          alt={file.name}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                        />
                      </Box>
                      <Box>
                        <Badge 
                          colorScheme={getSpeciesBadgeColor(file.prediction?.species || '')}
                          mb={1}
                        >
                          {file.prediction?.species}
                        </Badge>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1} mb={1}>
                          {file.name}
                        </Text>
                        <Box 
                          w="100%" 
                          h="6px" 
                          bg="gray.100" 
                          borderRadius="full" 
                          overflow="hidden"
                          mb={1}
                        >
                          <Box 
                            w={`${(file.prediction?.confidence || 0) * 100}%`} 
                            h="100%" 
                            bg="brand.500"
                            borderRadius="full"
                          />
                        </Box>
                        <Text fontSize="xs" color="gray.500">
                          Confidence: {Math.round((file.prediction?.confidence || 0) * 100)}%
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
      
      {/* Image Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} display="flex" justifyContent="center" alignItems="center" minH="60vh">
            {selectedImage && (
              <Image 
                src={selectedImage} 
                alt="Preview" 
                maxH="70vh" 
                maxW="100%" 
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Analysis;
