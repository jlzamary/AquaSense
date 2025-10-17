import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  useColorModeValue,
  Select,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaImage, FaTimes, FaSpinner, FaCheck, FaFolder, FaFilter, FaSortAmountDown, FaDownload, FaTrash, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface Detection {
  species: string;
  probability: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface Prediction {
  species: string;
  bbox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  detections?: Detection[]; // For detect mode - multiple species with bounding boxes
  annotatedImageUrl?: string; // For detect mode - image with drawn bounding boxes
}

interface UploadedFile extends File {
  preview?: string;
  uploadProgress?: number;
  uploadComplete?: boolean;
  error?: string;
  prediction?: Prediction | null;
  storagePath?: string;
  downloadURL?: string;
}

interface Analysis {
  id: string;
  imageUrl: string;
  storagePath: string;
  species: string;
  timestamp: Timestamp;
  projectId: string;
  userId: string;
  location?: string;
  notes?: string;
  analysisMode?: 'predict' | 'detect'; // Track which mode was used
  detections?: Detection[]; // For detect mode results
  annotatedImageUrl?: string; // For detect mode - image with bounding boxes
}

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;  // Changed from userId
  members: string[]; // Array of user UIDs who have access
  createdAt: Timestamp;
}

// API function to analyze images with predict or detect mode
const analyzeImage = async (file: File, mode: 'predict' | 'detect' = 'predict'): Promise<Prediction> => {
  try {
    // Create FormData to send the actual file
    const formData = new FormData();
    formData.append('file', file);

    // Choose endpoint based on mode
    const endpoint = mode === 'detect' 
      ? 'https://aquasense-api.onrender.com/detect'
      : 'https://aquasense-api.onrender.com/predict';

    console.log(`Calling ${mode} endpoint:`, endpoint);

    // Call the AquaSense API endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response:', data);
    console.log('Mode:', mode);
    
    if (mode === 'detect') {
      // Detect mode returns multiple detections with bounding boxes and an annotated image
      console.log('Detect mode - annotated_image_url:', data.annotated_image_url);
      console.log('Detect mode - detections:', data.detections);
      
      const annotatedUrl = data.annotated_image_url || data.annotatedImageUrl || data.annotated_image || '';
      console.log('Final annotated URL:', annotatedUrl);
      
      return {
        species: data.detections && data.detections.length > 0 
          ? data.detections.map((d: Detection) => d.species).join(', ') 
          : 'No species detected',
        detections: data.detections || [],
        annotatedImageUrl: annotatedUrl
      };
    } else {
      // Predict mode returns single species prediction
      return {
        species: data.predicted_species || data.species || data.class_name || 'Unknown',
        bbox: data.bbox || data.bounding_box
      };
    }
  } catch (error) {
    console.error('Error calling AquaSense API:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
};

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Analysis = () => {
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  const tabFromUrl = searchParams.get('tab');
  
  // Tab state
  const [tabIndex, setTabIndex] = useState(tabFromUrl === 'history' ? 1 : 0);
  
  // Upload state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'predict' | 'detect'>('predict');
  
  // History state
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Shared state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdFromUrl || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser } = useAuth();
  const toast = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Theme
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      // Create an object that properly includes the File and our custom properties
      const uploadedFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
        uploadProgress: 0,
        uploadComplete: false,
        error: undefined,
        prediction: null
      }) as UploadedFile;
      return uploadedFile;
    });
    
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

  // Camera capture handler
  const handleCameraCapture = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFiles = event.target.files;
    if (capturedFiles && capturedFiles.length > 0) {
      const filesArray = Array.from(capturedFiles);
      const newFiles = filesArray.map(file => {
        const uploadedFile = Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadProgress: 0,
          uploadComplete: false,
          error: undefined,
          prediction: null
        }) as UploadedFile;
        return uploadedFile;
      });
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Reset the input so the same file can be captured again
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  }, []);

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;
      try {
        // Fetch projects owned by the user
        const ownedQuery = query(
          collection(db, 'projects'),
          where('ownerId', '==', currentUser.uid)
        );
        
        // Fetch projects where user is a member
        const sharedQuery = query(
          collection(db, 'projects'),
          where('members', 'array-contains', currentUser.uid)
        );
        
        const [ownedSnapshot, sharedSnapshot] = await Promise.all([
          getDocs(ownedQuery),
          getDocs(sharedQuery)
        ]);
        
        const ownedProjects = ownedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        
        const sharedProjects = sharedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        
        // Combine and sort by createdAt
        const allProjects = [...ownedProjects, ...sharedProjects]
          .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        
        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [currentUser]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!currentUser) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        
        // If a project is selected, show ALL images in that project (collaborative view)
        // If no project is selected, show only the user's own images
        let q;
        if (selectedProjectId) {
          console.log('Fetching analyses for project:', selectedProjectId);
          q = query(
            collection(db, 'analyses'),
            where('projectId', '==', selectedProjectId)
          );
        } else {
          console.log('Fetching analyses for current user only');
          q = query(
            collection(db, 'analyses'),
            where('userId', '==', currentUser.uid)
          );
        }
        
        if (sortBy === 'date') {
          q = query(q, orderBy('timestamp', sortOrder));
        }
        
        console.log('Executing query...');
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} analyses`);
        
        // Get all analyses data and ensure image URLs are valid
        const analysesData = await Promise.all(
          querySnapshot.docs.map(async (snap) => {
            const data = snap.data() as any;

            // Prefer explicit fields if present
            const storedUrl: string | undefined = data.downloadURL || data.imageUrl;
            const storedPath: string | undefined = data.storagePath || '';

            const looksLikeUrl = (s?: string) => typeof s === 'string' && s.startsWith('http');
            const urlLooksBroken = (s?: string) =>
              !!s && (s.includes('/undefined') || s.includes('%2Fundefined'));

            try {
              // Case A: We already have a sane download URL
              if (looksLikeUrl(storedUrl) && !urlLooksBroken(storedUrl)) {
                return {
                  id: snap.id,
                  ...data,
                  imageUrl: storedUrl,
                  storagePath: storedPath || storedUrl, // keep something for reference
                } as Analysis;
              }

              // Case B: URL is missing or obviously broken — try to rebuild from storagePath
              if (typeof storedPath === 'string' && storedPath.trim()) {
                try {
                  const fileRef = ref(storage, storedPath);
                  const freshUrl = await getDownloadURL(fileRef);

                  // persist the repair so you don't redo it next time
                  await updateDoc(snap.ref, {
                    storagePath: storedPath,
                    imageUrl: freshUrl,
                  });

                  return {
                    id: snap.id,
                    ...data,
                    imageUrl: freshUrl,
                    storagePath: storedPath,
                  } as Analysis;
                } catch (e) {
                  console.error('getDownloadURL failed for', snap.id, storedPath, e);
                  // fall through to "broken" return
                }
              }

              // Case C: nothing usable — mark empty to trigger UI fallback
              console.warn('No valid image path/URL in document:', snap.id, data);
              return {
                id: snap.id,
                ...data,
                imageUrl: '',
                storagePath: '',
              } as Analysis;
            } catch (err) {
              console.error('Error processing analysis doc', snap.id, err);
              return {
                id: snap.id,
                ...data,
                imageUrl: '',
                storagePath: '',
              } as Analysis;
            }
          })
        );
        
        setAnalyses(analysesData);
      } catch (error: any) {
        console.error('Error fetching analyses:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
        toast({
          title: 'Error loading analyses',
          description: error?.message || 'Failed to load analyses. Check console for details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchAnalyses();
  }, [currentUser, selectedProjectId, sortBy, sortOrder]);

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
    if (!currentUser || !file.name) {
      console.error('Missing required data for upload:', { currentUser: !!currentUser, fileName: file.name });
      throw new Error('Missing required data for upload');
    }
    
    try {
      // Generate a unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.name}`;
      const storagePath = `uploads/${currentUser.uid}/${uniqueFilename}`;
      console.log('Generated storage path:', storagePath); // Debug log
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise<{ downloadURL: string; storagePath: string }>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setFiles(prevFiles => {
              const newFiles = [...prevFiles];
              newFiles[index] = { 
                ...newFiles[index], 
                uploadProgress: progress,
                storagePath // Store the path for later use
              };
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
              console.log('Upload successful:', { storagePath, downloadURL }); // Debug log
              
              setFiles(prevFiles => {
                const newFiles = [...prevFiles];
                newFiles[index] = { 
                  ...newFiles[index], 
                  uploadProgress: 100, 
                  uploadComplete: true,
                  storagePath,
                  downloadURL
                };
                return newFiles;
              });
              resolve({ downloadURL, storagePath });
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const analyzeFiles = async () => {
    if (!currentUser || files.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    
    try {
      // Upload files and get results
      const uploadResults = await Promise.all(
        files.map(async (file, index) => {
          try {
            const result = await uploadFile(file, index);
            if (!result || !result.downloadURL || !result.storagePath) {
              throw new Error('Upload failed - missing URL or path');
            }
            return result;
          } catch (error) {
            console.error('Error uploading file:', error);
            return null;
          }
        })
      );

      // Filter out failed uploads
      const successfulUploads = uploadResults.filter((result): result is { downloadURL: string; storagePath: string } => {
        return result !== null && 'downloadURL' in result && 'storagePath' in result;
      });

      if (successfulUploads.length === 0) {
        throw new Error('No files were uploaded successfully');
      }
      
      // Analyze and store results
      const analysisPromises = files.slice(0, successfulUploads.length).map(async (file, index) => {
        try {
          const result = successfulUploads[index];
          console.log('Processing upload result:', result); // Debug log
          const prediction = await analyzeImage(file, analysisMode);
          
          // Validate required data before saving
          if (!result.storagePath || !result.downloadURL) {
            console.error('Missing required data for analysis:', { storagePath: result.storagePath, downloadURL: result.downloadURL });
            throw new Error('Missing required data for analysis');
          }

          console.log('Saving analysis with:', { storagePath: result.storagePath, downloadURL: result.downloadURL, mode: analysisMode });
          console.log('Prediction data:', prediction);
          
          const analysisData: any = {
            userId: currentUser.uid,
            projectId: selectedProjectId || '',
            storagePath: result.storagePath,
            imageUrl: result.downloadURL,
            species: prediction.species,
            timestamp: serverTimestamp(),
            analysisMode: analysisMode,
          };
          
          // Add mode-specific data
          if (analysisMode === 'detect') {
            analysisData.detections = prediction.detections || [];
            analysisData.annotatedImageUrl = prediction.annotatedImageUrl || '';
            console.log('Detect mode - saving annotatedImageUrl:', analysisData.annotatedImageUrl);
            console.log('Detect mode - saving detections:', analysisData.detections);
          } else {
            analysisData.bbox = prediction.bbox;
          }
          
          console.log('Final analysis data to save:', analysisData);
          await addDoc(collection(db, 'analyses'), analysisData);
          
          setFiles(prevFiles => {
            const newFiles = [...prevFiles];
            newFiles[index] = { ...newFiles[index], prediction };
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

      // Refresh analyses list
      const event = new Event('refreshAnalyses');
      window.dispatchEvent(event);
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

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'analyses', analysisId));
      setAnalyses(analyses.filter(a => a.id !== analysisId));
      toast({
        title: 'Success',
        description: 'Analysis deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete analysis.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Species', 'Location', 'Project', 'Notes'];
    const rows = analyses.map(analysis => [
      analysis.timestamp.toDate().toLocaleString(),
      analysis.species,
      analysis.location || '',
      projects.find(p => p.id === analysis.projectId)?.name || '',
      analysis.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchTerm === '' ||
      analysis.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecies = speciesFilter === 'all' || analysis.species === speciesFilter;

    return matchesSearch && matchesSpecies;
  });

  const uniqueSpecies = Array.from(new Set(analyses.map(a => a.species))).sort();

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
            Upload and analyze images, or view your analysis history.
          </Text>
        </Box>

        {/* Project Selection */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4} align="start">
              <Icon as={FaFolder} boxSize={5} color="brand.500" mt={2} />
              <Box flex={1}>
                <Text fontWeight="medium" mb={2}>Select Project</Text>
                <Select
                  placeholder="All Projects"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
                {projects.length === 0 && (
                  <Alert status="info" mt={2} borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      No projects yet. Create a project in the Dashboard.
                    </Text>
                  </Alert>
                )}
              </Box>
            </HStack>
          </CardBody>
        </Card>

        {/* Main Content Tabs */}
        <Tabs variant="enclosed" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
          <TabList>
            <Tab>Upload & Analyze</Tab>
            <Tab>Analysis History</Tab>
          </TabList>

          <TabPanels>
            {/* Upload & Analyze Panel */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6}>
                {/* Analysis Mode Selection */}
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                  <CardBody>
                    <HStack spacing={4} align="start">
                      <Icon as={FaImage} boxSize={5} color="brand.500" mt={2} />
                      <Box flex={1}>
                        <Text fontWeight="medium" mb={2}>Analysis Mode</Text>
                        <Select
                          value={analysisMode}
                          onChange={(e) => setAnalysisMode(e.target.value as 'predict' | 'detect')}
                        >
                          <option value="predict">Predict - Single species identification</option>
                          <option value="detect">Detect - Multiple species with bounding boxes</option>
                        </Select>
                        <Text fontSize="sm" color="gray.500" mt={2}>
                          {analysisMode === 'predict' 
                            ? 'Identifies the primary species in the image'
                            : 'Detects multiple species and returns an image with bounding boxes'
                          }
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>

                {/* Dropzone */}
                <Box w="100%">
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
                    w="100%"
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

                  {/* Hidden camera input */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    style={{ display: 'none' }}
                    multiple
                  />

                  {/* Camera button - Only show on mobile/tablet */}
                  <Button
                    onClick={openCamera}
                    colorScheme="brand"
                    variant="outline"
                    leftIcon={<FaCamera />}
                    w="100%"
                    mt={4}
                    size="lg"
                    display={{ base: 'flex', md: 'none' }}
                  >
                    Take Photo
                  </Button>
                </Box>

                {/* Uploaded files */}
                {files.length > 0 && (
                  <Box w="100%">
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
                        isDisabled={files.length === 0 || isAnalyzing}
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
                            onClick={() => {
                              // Show annotated image if available, otherwise show preview
                              const imageToShow = file.prediction?.annotatedImageUrl || file.preview;
                              if (imageToShow) openImagePreview(imageToShow);
                            }}
                          >
                            <Image
                              src={file.prediction?.annotatedImageUrl || file.preview}
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
                                {file.prediction.detections && file.prediction.detections.length > 0 && (
                                  <Text fontSize="xs" color="gray.600" fontWeight="medium">
                                    {file.prediction.detections.length} detection{file.prediction.detections.length > 1 ? 's' : ''}
                                  </Text>
                                )}
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
              </VStack>
            </TabPanel>

            {/* Analysis History Panel */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                {/* Search and Filters */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by species, location, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>

                  <HStack spacing={2}>
                    <Menu>
                      <MenuButton
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                        leftIcon={<FaFilter />}
                        variant="outline"
                      >
                        Filter Species
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => setSpeciesFilter('all')}>
                          All Species
                        </MenuItem>
                        {uniqueSpecies.map(species => (
                          <MenuItem
                            key={species}
                            onClick={() => setSpeciesFilter(species)}
                          >
                            {species}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>

                    <Menu>
                      <MenuButton
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                        leftIcon={<FaSortAmountDown />}
                        variant="outline"
                      >
                        Sort
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                          Latest First
                        </MenuItem>
                        <MenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                          Oldest First
                        </MenuItem>
                      </MenuList>
                    </Menu>

                    <Tooltip label="Export to CSV">
                      <IconButton
                        aria-label="Export to CSV"
                        icon={<FaDownload />}
                        onClick={exportToCSV}
                        variant="outline"
                      />
                    </Tooltip>
                  </HStack>
                </SimpleGrid>

                {/* Analysis Grid */}
                {isLoadingHistory ? (
                  <Box py={10} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FaSpinner} animation={`${spin} 1s linear infinite`} boxSize={8} color="brand.500" />
                  </Box>
                ) : filteredAnalyses.length === 0 ? (
                  <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardBody textAlign="center" py={10}>
                      <Text fontSize="lg" color="gray.500">
                        {`No analyses found${searchTerm ? ` matching "${searchTerm}"` : ''}.`}
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredAnalyses.map((analysis) => (
                      <Card
                        key={analysis.id}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                        overflow="hidden"
                        _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Box
                            h="200px"
                            bg="gray.100"
                            mb={4}
                            borderRadius="md"
                            overflow="hidden"
                            position="relative"
                            cursor="pointer"
                            onClick={() => {
                              // Show annotated image if available (for detect mode), otherwise show original
                              const imageToShow = analysis.annotatedImageUrl || analysis.imageUrl;
                              if (imageToShow) openImagePreview(imageToShow);
                            }}
                          >
                            {(analysis.annotatedImageUrl || analysis.imageUrl) ? (
                              <Image
                                src={analysis.annotatedImageUrl || analysis.imageUrl}
                                alt="Analysis"
                                objectFit="cover"
                                w="100%"
                                h="100%"
                                fallback={
                                  <Box
                                    w="100%"
                                    h="100%"
                                    bg="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Icon as={FaImage} boxSize={8} color="gray.400" />
                                  </Box>
                                }
                                onError={() => {
                                  console.warn('Bad URL:', analysis.annotatedImageUrl || analysis.imageUrl);
                                }}
                              />
                            ) : (
                              <Box
                                w="100%"
                                h="100%"
                                bg="gray.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Icon as={FaImage} boxSize={8} color="gray.400" />
                              </Box>
                            )}
                            {analysis.location && (
                              <Tooltip label={analysis.location}>
                                <Box
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  bg="blackAlpha.600"
                                  color="white"
                                  p={2}
                                  borderRadius="md"
                                >
                                  <FaMapMarkerAlt />
                                </Box>
                              </Tooltip>
                            )}
                          </Box>

                          <VStack align="stretch" spacing={3}>
                            <Flex align="center">
                              <Heading size="md">{analysis.species}</Heading>
                              <Spacer />
                              <Badge
                                colorScheme={getSpeciesBadgeColor(analysis.species)}
                                fontSize="sm"
                              >
                                {analysis.analysisMode === 'detect' ? 'Detect' : 'Predict'}
                              </Badge>
                            </Flex>

                            {analysis.detections && analysis.detections.length > 0 && (
                              <Box>
                                <Text fontSize="sm" fontWeight="medium" mb={1}>Detections ({analysis.detections.length}):</Text>
                                <VStack align="stretch" spacing={1}>
                                  {analysis.detections.slice(0, 3).map((detection, idx) => (
                                    <HStack key={idx} justify="space-between" fontSize="xs">
                                      <Text>{detection.species}</Text>
                                      <Badge colorScheme="green" fontSize="0.6rem">
                                        {(detection.probability * 100).toFixed(0)}%
                                      </Badge>
                                    </HStack>
                                  ))}
                                  {analysis.detections.length > 3 && (
                                    <Text fontSize="xs" color="gray.500">
                                      +{analysis.detections.length - 3} more
                                    </Text>
                                  )}
                                </VStack>
                              </Box>
                            )}

                            <Text fontSize="sm" color="gray.500">
                              Project: {projects.find(p => p.id === analysis.projectId)?.name || 'None'}
                            </Text>

                            <Text fontSize="sm" color="gray.500">
                              {analysis.timestamp.toDate().toLocaleString()}
                            </Text>

                            {analysis.notes && (
                              <Text fontSize="sm" noOfLines={2}>
                                {analysis.notes}
                              </Text>
                            )}

                            <HStack spacing={2} justify="flex-end">
                              <IconButton
                                aria-label="Delete analysis"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteAnalysis(analysis.id)}
                              />
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Image Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Image Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={6} display="flex" justifyContent="center" alignItems="center" minH="60vh">
            {selectedImage ? (
              <Image 
                src={selectedImage} 
                alt="Preview" 
                maxH="70vh" 
                maxW="100%" 
                objectFit="contain"
                fallback={
                  <VStack spacing={4} py={10}>
                    <Icon as={FaImage} boxSize={16} color="gray.400" />
                    <Text color="gray.500" fontSize="lg">
                      Image not available
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      The image could not be loaded or may have been deleted
                    </Text>
                  </VStack>
                }
              />
            ) : (
              <VStack spacing={4} py={10}>
                <Icon as={FaImage} boxSize={16} color="gray.400" />
                <Text color="gray.500" fontSize="lg">
                  No image selected
                </Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Analysis;