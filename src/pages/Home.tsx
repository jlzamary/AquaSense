import { Box, Button, Container, Flex, Heading, Text, VStack, Image, SimpleGrid, useBreakpointValue, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const headingSize = useBreakpointValue({ base: '2xl', md: '4xl' });

  const bgGradient = useColorModeValue(
    'linear(to-r, brand.500, brand.600)',
    'linear(to-r, brand.600, brand.700)'
  );
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Box minH="100vh">
      {/* Hero Section */}
      <Box bgGradient={bgGradient} color="white" py={20} minH="60vh" display="flex" alignItems="center">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center">
            <VStack spacing={6} align="start">
              <Heading as="h1" size={headingSize} lineHeight="1.2">
                AI-Powered Benthic Species Identification
              </Heading>
              <Text fontSize="xl">
                Revolutionizing marine research with advanced computer vision to identify and monitor benthic species with unprecedented accuracy.
              </Text>
              <Flex direction={{ base: 'column', sm: 'row' }} gap={4} w="full">
                {currentUser ? (
                  <Button as={RouterLink} to="/dashboard" colorScheme="whiteAlpha" size={buttonSize}>
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button as={RouterLink} to="/signup" colorScheme="white" color="brand.600" size={buttonSize}>
                      Get Started
                    </Button>
                    <Button as={RouterLink} to="/login" variant="outline" colorScheme="whiteAlpha" size={buttonSize}>
                      Sign In
                    </Button>
                  </>
                )}
              </Flex>
            </VStack>
            <Box>
              <Image
                src="/undersea-illustration.svg"
                alt="Underwater marine life"
                borderRadius="lg"
                shadow="2xl"
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW="container.xl">
          <VStack spacing={16}>
            <VStack textAlign="center" maxW="3xl" mx="auto">
              <Text color="brand.400" fontWeight="bold">FEATURES</Text>
              <Heading as="h2" size="xl" color={headingColor}>Advanced Marine Species Identification</Heading>
              <Text color={textColor}>
                Our platform leverages cutting-edge AI to help researchers and marine biologists identify and monitor benthic species with high accuracy.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {[
                {
                  title: '7 Benthic Species',
                  description: 'Accurately identify 7 different benthic species including Scallop, Roundfish, Crab, and more.'
                },
                {
                  title: 'Image Analysis',
                  description: 'Upload single or multiple images for quick and accurate species identification.'
                },
                {
                  title: 'Real-time Monitoring',
                  description: 'Track species distribution and population changes over time with our analytics dashboard.'
                },
                {
                  title: 'High Accuracy',
                  description: 'Our AI model is trained on a comprehensive dataset of 10,500+ images for reliable results.'
                },
                {
                  title: 'Data Export',
                  description: 'Export your analysis results for further research and reporting.'
                },
                {
                  title: 'Secure & Private',
                  description: 'Your data is encrypted and stored securely with enterprise-grade security measures.'
                }
              ].map((feature, index) => (
                <Box
                  key={index}
                  p={6}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={cardBorder}
                  borderRadius="lg"
                  _hover={{
                    shadow: 'lg',
                    transform: 'translateY(-4px)',
                    transition: 'all 0.2s',
                    borderColor: 'brand.400'
                  }}
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <Heading as="h3" size="md" mb={2} color={headingColor}>
                    {feature.title}
                  </Heading>
                  <Text color={textColor} flexGrow={1}>
                    {feature.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg={useColorModeValue('white', 'gray.800')} py={20}>
        <Container maxW="container.md" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h2" size="xl">Ready to explore the depths?</Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Join researchers and marine biologists in advancing our understanding of benthic ecosystems.
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
