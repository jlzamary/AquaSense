import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  useBreakpointValue,
  useColorModeValue,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

const Home = () => {
  const { currentUser } = useAuth();

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const headingSize = useBreakpointValue({ base: '3xl', md: '5xl' });

  const heroGradient = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.900', 'white');

  return (
    <Box w="100%">
      {/* HERO */}
      <Box
        position="relative"
        bgGradient={heroGradient}
        color="white"
        overflow="hidden"
      >
        {/* Background Video */}
        <Box
          as="video"
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          objectFit="cover"
          autoPlay
          loop
          muted
          playsInline
          opacity={0.3}
          pointerEvents="none"
        >
          <source src="/underwater-fish.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
        </Box>

        {/* Dark overlay for better text readability */}
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.400"
          pointerEvents="none"
        />
        
        {/* subtle corner glow */}
        <Box
          position="absolute"
          inset={0}
          bgGradient="radial(transparent 0%, rgba(255,255,255,0.12) 60%)"
          pointerEvents="none"
        />
        <Container maxW="7xl" py={{ base: 16, md: 24 }} zIndex={1} position="relative">
          <VStack align="center" spacing={{ base: 6, md: 8 }} textAlign="center">
              <Badge
                variant="subtle"
                colorScheme="whiteAlpha"
                px={3}
                py={1}
                borderRadius="full"
              >
                Marine AI Platform
              </Badge>

              <Heading as="h1" size="xl" fontSize={headingSize} lineHeight="1.1">
                AI-Powered Benthic Species Identification
              </Heading>

              <Text fontSize={{ base: 'md', md: 'xl' }} opacity={0.95}>
                Accelerate marine research with computer vision that identifies and monitors
                benthic species—fast, accurate, and built for field workflows.
              </Text>

              <Flex direction={{ base: 'column', sm: 'row' }} gap={4}>
                {currentUser ? (
                  <Button
                    as={RouterLink}
                    to="/dashboard"
                    size={buttonSize}
                    colorScheme="whiteAlpha"
                    variant="solid"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      as={RouterLink}
                      to="/signup"
                      size={buttonSize}
                      colorScheme="white"
                      color="brand.700"
                    >
                      Get Started
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/login"
                      size={buttonSize}
                      variant="outline"
                      colorScheme="whiteAlpha"
                      _hover={{ bg: 'whiteAlpha.200' }}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Flex>

              <Flex gap={6} wrap="wrap" pt={2}>
                {[
                  '7 target species',
                  '10,500+ training images',
                  'Exportable analytics',
                ].map((item) => (
                  <Flex key={item} align="center" gap={2}>
                    <Icon as={FaCheckCircle} />
                    <Text fontSize="sm" opacity={0.9}>{item}</Text>
                  </Flex>
                ))}
              </Flex>
          </VStack>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW="7xl">
          <VStack spacing={{ base: 10, md: 16 }}>
            <VStack textAlign="center" maxW="3xl" mx="auto" spacing={4}>
              <Text color="brand.500" fontWeight="bold" letterSpacing="wide">
                FEATURES
              </Text>
              <Heading as="h2" size="xl" color={headingColor}>
                Advanced Marine Species Identification
              </Heading>
              <Text color={textColor} fontSize={{ base: 'md', md: 'lg' }}>
                Purpose-built for researchers and biologists to classify images, track distributions,
                and export results—accurately and securely.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {[
                {
                  title: '7 Benthic Species',
                  description:
                    'Identify Scallop, Roundfish, Crab, and more with tuned class mappings.',
                },
                {
                  title: 'Bulk Image Analysis',
                  description:
                    'Upload single shots or whole batches for rapid classification.',
                },
                {
                  title: 'Real-time Monitoring',
                  description:
                    'Dashboard views to track counts, confidence, and temporal change.',
                },
                {
                  title: 'High Accuracy',
                  description:
                    'Model trained on 10,500+ images with rigorous validation.',
                },
                {
                  title: 'Data Export',
                  description:
                    'Export CSV/JSON for downstream stats, GIS, or lab notebooks.',
                },
                {
                  title: 'Secure & Private',
                  description:
                    'Encryption at rest and in transit with role-based access.',
                },
              ].map((f) => (
                <Box
                  key={f.title}
                  p={6}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={cardBorder}
                  borderRadius="xl"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg', borderColor: 'brand.400' }}
                >
                  <Heading as="h3" size="md" mb={2} color={headingColor}>
                    {f.title}
                  </Heading>
                  <Text color={textColor}>{f.description}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA */}
      <Box bg={useColorModeValue('white', 'gray.800')} py={{ base: 16, md: 24 }}>
        <Container maxW="4xl" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h2" size="xl" color={headingColor}>
              Ready to explore the depths?
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color={textColor} maxW="2xl">
              Join researchers using AquaSense to speed up benthic surveys and improve data quality.
            </Text>
            <Button
              as={RouterLink}
              to={currentUser ? '/dashboard' : '/signup'}
              colorScheme="brand"
              size="lg"
              px={10}
            >
              {currentUser ? 'Go to Dashboard' : 'Get Started for Free'}
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
