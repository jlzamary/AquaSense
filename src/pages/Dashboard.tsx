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
  Image
} from '@chakra-ui/react';
import { FaUpload, FaChartLine, FaHistory, FaFish } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisResult {
  id: string;
  imageUrl: string;
  species: string;
  confidence: number;
  timestamp: Timestamp;
  location?: string;
}

const Dashboard = () => {
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          const analyses = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AnalysisResult[];
          
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
            const analyses = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as AnalysisResult[];
            
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
    <Box minH="100vh" bg={bgGradient} display="flex" flexDirection="column">
      <Box flex="1" w="100%" py={8} overflowY="auto">
        <Container maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
          {/* Quick Actions Section */}
          <VStack spacing={8} align="stretch" w="100%">
            <Box w="full">
              <Heading size="xl" mb={6} color={headingColor} fontWeight="semibold">
                Quick Actions
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* New Analysis Card */}
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
                      <Heading size="md" color={headingColor}>New Analysis</Heading>
                      <Text fontSize="sm" color={textColor}>
                        Upload new images for species identification
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Species Catalog Card */}
                <Card
                  as={RouterLink}
                  to="/species"
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
                        <Icon as={FaFish} boxSize={6} color="brand.600" />
                      </Box>
                      <Heading size="md" color={headingColor}>Species Catalog</Heading>
                      <Text fontSize="sm" color={textColor}>
                        Explore the benthic species in our database
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Analysis History Card */}
                <Card
                  as={RouterLink}
                  to="/analysis/history"
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
                      <Heading size="md" color={headingColor}>Analysis History</Heading>
                      <Text fontSize="sm" color={textColor}>
                        View and manage your previous analyses
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Recent Analyses Section */}
            <Box w="full">
              <HStack justify="space-between" mb={6} w="full">
                <Heading size="xl" color={headingColor} fontWeight="semibold">
                  Recent Analyses
                </Heading>
                <Button 
                  as={RouterLink} 
                  to="/analysis/history" 
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
                          <Image
                            src={analysis.imageUrl}
                            alt={`${analysis.species} analysis`}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                          />
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
                      No analysis history yet. Upload your first image to get started!
                    </Text>
                    <Button 
                      as={RouterLink} 
                      to="/analysis" 
                      colorScheme="brand" 
                      leftIcon={<FaUpload />}
                      mt={2}
                      size="sm"
                    >
                      Start Analysis
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
