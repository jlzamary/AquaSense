import { useState, useEffect } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Icon, 
  useToast, 
  Spinner, 
  Center,
  useColorModeValue,
  Badge,
  Container,
  Image,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Editable,
  EditableInput,
  EditableTextarea,
  EditablePreview,
  Tooltip
} from '@chakra-ui/react';
import { FaUpload, FaChartLine, FaHistory, FaFish, FaFolder, FaPlus, FaTrash } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp, orderBy, limit, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisResult {
  id: string;
  imageUrl: string;
  storagePath?: string;
  species: string;
  confidence: number;
  timestamp: Timestamp;
  location?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
}

const Dashboard = () => {
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { currentUser } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-b, brand.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');
  const cardHover = useColorModeValue(
    { transform: 'translateY(-4px)', shadow: 'lg' },
    { transform: 'translateY(-4px)', shadow: 'dark-lg' }
  );

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const analysesRef = collection(db, 'analyses');
        
        try {
          const q = query(
            analysesRef, 
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(5)
          );
          
          const querySnapshot = await getDocs(q);
          
          // Apply defensive URL repair logic
          const analyses = await Promise.all(
            querySnapshot.docs.map(async (snap) => {
              const data = snap.data() as any;
              
              const storedUrl: string | undefined = data.downloadURL || data.imageUrl;
              const storedPath: string | undefined = data.storagePath || '';
              
              const looksLikeUrl = (s?: string) => typeof s === 'string' && s.startsWith('http');
              const urlLooksBroken = (s?: string) =>
                !!s && (s.includes('/undefined') || s.includes('%2Fundefined'));
              
              try {
                // Case A: We have a sane download URL
                if (looksLikeUrl(storedUrl) && !urlLooksBroken(storedUrl)) {
                  return {
                    id: snap.id,
                    ...data,
                    imageUrl: storedUrl,
                    storagePath: storedPath || storedUrl,
                  } as AnalysisResult;
                }
                
                // Case B: URL is broken — try to rebuild from storagePath
                if (typeof storedPath === 'string' && storedPath.trim()) {
                  try {
                    const fileRef = ref(storage, storedPath);
                    const freshUrl = await getDownloadURL(fileRef);
                    
                    // Persist the repair
                    await updateDoc(snap.ref, {
                      storagePath: storedPath,
                      imageUrl: freshUrl,
                    });
                    
                    return {
                      id: snap.id,
                      ...data,
                      imageUrl: freshUrl,
                      storagePath: storedPath,
                    } as AnalysisResult;
                  } catch (e) {
                    console.error('Failed to get URL for', snap.id, e);
                  }
                }
                
                // Case C: nothing usable
                return {
                  id: snap.id,
                  ...data,
                  imageUrl: '',
                  storagePath: '',
                } as AnalysisResult;
              } catch (err) {
                console.error('Error processing analysis', snap.id, err);
                return {
                  id: snap.id,
                  ...data,
                  imageUrl: '',
                  storagePath: '',
                } as AnalysisResult;
              }
            })
          );
          
          setRecentAnalyses(analyses);
        } catch (error: any) {
          if (error.code === 'failed-precondition') {
            // If the index doesn't exist, try without ordering
            console.warn('Index not found, falling back to unordered query');
            const q = query(
              analysesRef,
              where('userId', '==', currentUser.uid),
              limit(5)
            );
            
            const querySnapshot = await getDocs(q);
            
            // Apply defensive URL repair logic (same as above)
            const analyses = await Promise.all(
              querySnapshot.docs.map(async (snap) => {
                const data = snap.data() as any;
                
                const storedUrl: string | undefined = data.downloadURL || data.imageUrl;
                const storedPath: string | undefined = data.storagePath || '';
                
                const looksLikeUrl = (s?: string) => typeof s === 'string' && s.startsWith('http');
                const urlLooksBroken = (s?: string) =>
                  !!s && (s.includes('/undefined') || s.includes('%2Fundefined'));
                
                try {
                  if (looksLikeUrl(storedUrl) && !urlLooksBroken(storedUrl)) {
                    return {
                      id: snap.id,
                      ...data,
                      imageUrl: storedUrl,
                      storagePath: storedPath || storedUrl,
                    } as AnalysisResult;
                  }
                  
                  if (typeof storedPath === 'string' && storedPath.trim()) {
                    try {
                      const fileRef = ref(storage, storedPath);
                      const freshUrl = await getDownloadURL(fileRef);
                      await updateDoc(snap.ref, { storagePath: storedPath, imageUrl: freshUrl });
                      return { id: snap.id, ...data, imageUrl: freshUrl, storagePath: storedPath } as AnalysisResult;
                    } catch (e) {
                      console.error('Failed to get URL for', snap.id, e);
                    }
                  }
                  
                  return { id: snap.id, ...data, imageUrl: '', storagePath: '' } as AnalysisResult;
                } catch (err) {
                  console.error('Error processing analysis', snap.id, err);
                  return { id: snap.id, ...data, imageUrl: '', storagePath: '' } as AnalysisResult;
                }
              })
            );
            
            // Sort client-side as fallback
            analyses.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            setRecentAnalyses(analyses);
          } else {
            throw error; // Re-throw other errors
          }
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your recent analyses.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAnalyses();
  }, [currentUser, toast]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) {
        setIsLoadingProjects(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your projects.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [currentUser, toast]);

  const handleUpdateProject = async (projectId: string, field: 'name' | 'description', value: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { [field]: value });
      
      // Update local state
      setProjects(prevProjects =>
        prevProjects.map(p => p.id === projectId ? { ...p, [field]: value } : p)
      );
      
      toast({
        title: 'Project updated',
        description: `Project ${field} updated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: `Failed to update project ${field}.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteDoc(doc(db, 'projects', projectToDelete.id));
      
      // Update local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete.id));
      
      toast({
        title: 'Project deleted',
        description: 'Project has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    onDeleteOpen();
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

  if (isLoading) {
    return (
      <Center minH="calc(100vh - 64px)" bg={bgGradient}>
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgGradient} py={1}>
        <Container maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
          {/* Quick Actions Section */}
          <VStack spacing={8} align="stretch" w="100%">
            <Box w="full">
              <Heading size="xl" mb={6} color={headingColor} fontWeight="semibold">
                Quick Actions
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* Image Upload Card */}
                <Card 
                  as={RouterLink} 
                  to="/analysis" 
                  _hover={cardHover}
                  transition="all 0.3s ease-in-out"
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <CardBody display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
                    <VStack spacing={4} textAlign="center">
                      <Box p={3} bg="brand.50" borderRadius="full" mb={2}>
                        <Icon as={FaUpload} boxSize={6} color="brand.600" />
                      </Box>
                      <Heading size="md" color={headingColor}>Image Upload</Heading>
                      <Text fontSize="sm" color={textColor}>
                        Upload new images for identification
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Metrics Card */}
                <Card
                  as={RouterLink}
                  to="/metrics"
                  _hover={cardHover}
                  transition="all 0.3s ease-in-out"
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <CardBody display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
                    <VStack spacing={4} textAlign="center">
                      <Box p={3} bg="brand.50" borderRadius="full" mb={2}>
                        <Icon as={FaChartLine} boxSize={6} color="brand.600" />
                      </Box>
                      <Heading size="md" color={headingColor}>Project Metrics</Heading>
                      <Text fontSize="sm" color={textColor}>
                        View statistics and analytics for your projects
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Projects Section */}
            <Box w="full">
              <HStack justify="space-between" mb={6} w="full">
                <Heading size="xl" color={headingColor} fontWeight="semibold">
                  Your Projects
                </Heading>
                <Button 
                  as={RouterLink} 
                  to="/metrics" 
                  variant="outline"
                  colorScheme="brand"
                  size="sm"
                  rightIcon={<FaFolder />}
                >
                  View All
                </Button>
              </HStack>

              {isLoadingProjects ? (
                <Center py={10}>
                  <Spinner size="lg" color="brand.500" />
                </Center>
              ) : projects.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {projects.map((project) => (
                    <Card 
                      key={project.id}
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      overflow="hidden"
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <VStack align="start" spacing={3} w="full">
                          <HStack w="full" justify="space-between">
                            <HStack flex="1" minW="0">
                              <Icon as={FaFolder} color="brand.500" boxSize={5} flexShrink={0} />
                              <Editable
                                defaultValue={project.name}
                                fontSize="lg"
                                fontWeight="bold"
                                color={headingColor}
                                w="full"
                                onSubmit={(value) => handleUpdateProject(project.id, 'name', value)}
                              >
                                <EditablePreview 
                                  py={1} 
                                  px={2}
                                  w="full"
                                  cursor="pointer"
                                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                                  borderRadius="md"
                                  noOfLines={1}
                                />
                                <EditableInput py={1} px={2} />
                              </Editable>
                            </HStack>
                            <Tooltip label="Delete project">
                              <IconButton
                                aria-label="Delete project"
                                icon={<FaTrash />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDeleteModal(project)}
                                flexShrink={0}
                              />
                            </Tooltip>
                          </HStack>
                          
                          <Editable
                            defaultValue={project.description || 'No description provided'}
                            fontSize="sm"
                            color={textColor}
                            w="full"
                            onSubmit={(value) => handleUpdateProject(project.id, 'description', value)}
                          >
                            <EditablePreview 
                              py={1} 
                              px={2}
                              w="full"
                              cursor="pointer"
                              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                              borderRadius="md"
                              noOfLines={2}
                              minH="40px"
                            />
                            <EditableTextarea py={1} px={2} rows={2} />
                          </Editable>
                          
                          <Text fontSize="xs" color={textColor} opacity={0.7}>
                            Created {new Date(project.createdAt?.toDate()).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </CardBody>
                      <CardFooter pt={0}>
                        <Button 
                          as={RouterLink} 
                          to={`/metrics?project=${project.id}`}
                          variant="ghost" 
                          colorScheme="brand" 
                          size="sm"
                          w="full"
                        >
                          View Metrics
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Box 
                  p={8} 
                  borderWidth={1} 
                  borderRadius="md" 
                  borderColor={borderColor}
                  bg={cardBg}
                  textAlign="center"
                >
                  <VStack spacing={4}>
                    <Icon as={FaFolder} boxSize={8} color={textColor} opacity={0.5} />
                    <Text color={textColor} opacity={0.8}>
                      No projects yet. Create your first project to organize your analyses!
                    </Text>
                    <Button 
                      as={RouterLink} 
                      to="/analysis" 
                      colorScheme="brand" 
                      leftIcon={<FaPlus />}
                      mt={2}
                      size="sm"
                    >
                      Create Project
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>

            {/* Recent Images Section */}
            <Box w="full">
              <HStack justify="space-between" mb={6} w="full">
                <Heading size="xl" color={headingColor} fontWeight="semibold">
                  Recent Images
                </Heading>
                <Button 
                  as={RouterLink} 
                  to="/analysis?tab=history" 
                  variant="outline"
                  colorScheme="brand"
                  size="sm"
                  rightIcon={<FaHistory />}
                >
                  View All
                </Button>
              </HStack>

              {recentAnalyses.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {recentAnalyses.map((analysis) => (
                    <Card 
                      key={analysis.id}
                      bg={cardBg}
                      border="1px"
                      borderColor={borderColor}
                      overflow="hidden"
                      _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={0}>
                        <HStack justify="space-between" align="flex-start">
                          <Text fontSize="sm" color={textColor} opacity={0.8}>
                            {new Date(analysis.timestamp?.toDate()).toLocaleDateString()}
                          </Text>
                          <Badge colorScheme={getSpeciesBadgeColor(analysis.species)}>
                            {analysis.species}
                          </Badge>
                        </HStack>
                      </CardHeader>
                      <CardBody py={4}>
                        <Box 
                          h="160px"
                          borderRadius="md"
                          mb={3}
                          overflow="hidden"
                          bg="gray.100"
                          position="relative"
                        >
                          {analysis.imageUrl ? (
                          <Image
                            src={analysis.imageUrl}
                            alt={`${analysis.species} analysis`}
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
                                  <Icon as={FaFish} boxSize={8} color="gray.400" />
                                </Box>
                              }
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
                              <Icon as={FaFish} boxSize={8} color="gray.400" />
                            </Box>
                          )}
                        </Box>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color={textColor}>
                              <Text as="span" fontWeight="medium">Confidence:</Text>{' '}
                              {Math.round(analysis.confidence * 100)}%
                            </Text>
                            {analysis.location && (
                              <Text fontSize="xs" color={textColor} opacity={0.8} noOfLines={1} maxW="120px">
                                {analysis.location}
                              </Text>
                            )}
                          </HStack>
                        </VStack>
                      </CardBody>
                      <CardFooter pt={0}>
                        <Button 
                          as={RouterLink}
                          to={`/analysis/${analysis.id}`}
                          size="sm"
                          variant="outline"
                          colorScheme="brand"
                          w="full"
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Box 
                  p={8} 
                  borderWidth={1} 
                  borderRadius="md" 
                  borderColor={borderColor}
                  bg={cardBg}
                  textAlign="center"
                >
                  <VStack spacing={4}>
                    <Icon as={FaHistory} boxSize={8} color={textColor} opacity={0.5} />
                    <Text color={textColor} opacity={0.8}>
                      No images uploaded yet. Upload your first image to get started!
                    </Text>
                    <Button 
                      as={RouterLink} 
                      to="/analysis" 
                      colorScheme="brand" 
                      leftIcon={<FaUpload />}
                      mt={2}
                      size="sm"
                    >
                      Upload Images
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>
          </VStack>
        </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text>
                Are you sure you want to delete the project <Text as="span" fontWeight="bold">"{projectToDelete?.name}"</Text>?
              </Text>
              <Text color="red.500" fontSize="sm">
                This action cannot be undone. All analyses associated with this project will remain, but they will no longer be grouped under this project.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Dashboard;
