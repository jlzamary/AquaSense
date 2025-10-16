import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Badge,
  Divider,
  Select,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { FaChartBar, FaFolder, FaImage, FaCalendar, FaPercentage } from 'react-icons/fa';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
}

interface Analysis {
  id: string;
  projectId: string;
  species: string;
  confidence: number;
  timestamp: Timestamp;
  userId: string;
}

interface ProjectMetrics {
  project: Project;
  totalAnalyses: number;
  avgConfidence: number;
  speciesBreakdown: { name: string; count: number; percentage: number }[];
  confidenceDistribution: { range: string; count: number }[];
  timelineData: { date: string; count: number }[];
  analyses: Analysis[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const Metrics = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectMetrics(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));

      setProjects(projectsData);
      
      // Auto-select first project if available
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Could not load projects.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectMetrics = async (projectId: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Get project details
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Get all analyses for this project
      const analysesQuery = query(
        collection(db, 'analyses'),
        where('projectId', '==', projectId),
        where('userId', '==', currentUser.uid)
      );
      const analysesSnapshot = await getDocs(analysesQuery);
      const analyses = analysesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Analysis));

      if (analyses.length === 0) {
        setMetrics({
          project,
          totalAnalyses: 0,
          avgConfidence: 0,
          speciesBreakdown: [],
          confidenceDistribution: [],
          timelineData: [],
          analyses: []
        });
        setIsLoading(false);
        return;
      }

      // Calculate average confidence
      const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

      // Species breakdown
      const speciesCounts: { [key: string]: number } = {};
      analyses.forEach(a => {
        speciesCounts[a.species] = (speciesCounts[a.species] || 0) + 1;
      });
      const speciesBreakdown = Object.entries(speciesCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / analyses.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      // Confidence distribution
      const confidenceRanges = [
        { range: '0-20%', min: 0, max: 0.2, count: 0 },
        { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
        { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
        { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
        { range: '80-100%', min: 0.8, max: 1.0, count: 0 },
      ];
      analyses.forEach(a => {
        const rangeIndex = confidenceRanges.findIndex(
          r => a.confidence >= r.min && a.confidence <= r.max
        );
        if (rangeIndex >= 0) {
          confidenceRanges[rangeIndex].count++;
        }
      });

      // Timeline data (group by day)
      const timelineCounts: { [key: string]: number } = {};
      analyses.forEach(a => {
        const date = a.timestamp.toDate().toLocaleDateString();
        timelineCounts[date] = (timelineCounts[date] || 0) + 1;
      });
      const timelineData = Object.entries(timelineCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setMetrics({
        project,
        totalAnalyses: analyses.length,
        avgConfidence,
        speciesBreakdown,
        confidenceDistribution: confidenceRanges,
        timelineData,
        analyses
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error',
        description: 'Could not load metrics.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !metrics) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Container>
    );
  }

  if (projects.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody textAlign="center" py={12}>
            <Icon as={FaChartBar} boxSize={12} color="gray.400" mb={4} />
            <Heading size="md" mb={2}>No Projects Yet</Heading>
            <Text color="gray.500" mb={4}>
              Create a project and add some analyses to see metrics
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" mb={2}>Project Metrics</Heading>
            <Text color={textColor}>
              Analytics and statistics for your research projects
            </Text>
          </Box>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            maxW="300px"
            bg={cardBg}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </HStack>

        {isLoading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : !metrics ? (
          <Text>Select a project to view metrics</Text>
        ) : metrics.totalAnalyses === 0 ? (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody textAlign="center" py={12}>
              <Icon as={FaImage} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>No Analyses Yet</Heading>
              <Text color="gray.500" mb={4}>
                This project doesn't have any analyses yet
              </Text>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Key Statistics */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel display="flex" alignItems="center" gap={2}>
                      <Icon as={FaImage} color="blue.500" />
                      Total Analyses
                    </StatLabel>
                    <StatNumber fontSize="3xl">{metrics.totalAnalyses}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel display="flex" alignItems="center" gap={2}>
                      <Icon as={FaPercentage} color="green.500" />
                      Avg Confidence
                    </StatLabel>
                    <StatNumber fontSize="3xl">
                      {(metrics.avgConfidence * 100).toFixed(1)}%
                    </StatNumber>
                    <StatHelpText>Mean probability</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel display="flex" alignItems="center" gap={2}>
                      <Icon as={FaFolder} color="purple.500" />
                      Species Found
                    </StatLabel>
                    <StatNumber fontSize="3xl">{metrics.speciesBreakdown.length}</StatNumber>
                    <StatHelpText>Unique species</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel display="flex" alignItems="center" gap={2}>
                      <Icon as={FaCalendar} color="orange.500" />
                      Active Days
                    </StatLabel>
                    <StatNumber fontSize="3xl">{metrics.timelineData.length}</StatNumber>
                    <StatHelpText>Days with analyses</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Charts */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Species Breakdown Pie Chart */}
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Species Distribution</Heading>
                  <Text fontSize="sm" color={textColor} mt={1}>
                    Breakdown by detected species
                  </Text>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.speciesBreakdown}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {metrics.speciesBreakdown.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <VStack align="stretch" mt={4} spacing={2}>
                    {metrics.speciesBreakdown.slice(0, 5).map((species, index) => (
                      <HStack key={species.name} justify="space-between">
                        <HStack>
                          <Box w={3} h={3} borderRadius="full" bg={COLORS[index % COLORS.length]} />
                          <Text fontSize="sm">{species.name}</Text>
                        </HStack>
                        <Badge colorScheme="blue">{species.count}</Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Confidence Distribution Bar Chart */}
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Confidence Distribution</Heading>
                  <Text fontSize="sm" color={textColor} mt={1}>
                    Analysis confidence levels
                  </Text>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.confidenceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0080e6" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <Text fontSize="sm" color={textColor} mt={4} textAlign="center">
                    Most analyses fall in the{' '}
                    <Text as="span" fontWeight="bold" color="brand.500">
                      {metrics.confidenceDistribution.reduce((max, curr) => 
                        curr.count > max.count ? curr : max
                      ).range}
                    </Text>
                    {' '}confidence range
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Timeline Chart */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Analysis Timeline</Heading>
                <Text fontSize="sm" color={textColor} mt={1}>
                  Number of analyses over time
                </Text>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0080e6"
                      strokeWidth={2}
                      dot={{ fill: '#0080e6', r: 4 }}
                      name="Analyses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Top Species Details */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Top Species</Heading>
                <Text fontSize="sm" color={textColor} mt={1}>
                  Most frequently detected species
                </Text>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  {metrics.speciesBreakdown.slice(0, 5).map((species, index) => (
                    <Box key={species.name}>
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Badge colorScheme="brand" fontSize="lg" px={2}>
                            #{index + 1}
                          </Badge>
                          <Text fontWeight="medium">{species.name}</Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Text fontSize="sm" color={textColor}>
                            {species.count} detections
                          </Text>
                          <Text fontSize="sm" fontWeight="bold" color="brand.500">
                            {species.percentage.toFixed(1)}%
                          </Text>
                        </HStack>
                      </HStack>
                      {index < 4 && <Divider />}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Metrics;

